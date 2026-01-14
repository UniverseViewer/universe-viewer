/*
 * Copyright (C) 2025 Mathieu Abati <mathieu.abati@gmail.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 */

/**
 * Worker Pool Manager.
 * Manages a pool of Web Workers for parallel computation.
 */

/**
 * Worker Pool Manager.
 * Manages a pool of Web Workers for parallel computation.
 */
class WorkerPool {
  /**
   * Create a worker pool.
   *
   * @param {class} workerClass - The Worker class to instantiate.
   * @param {number} [maxWorkers=null] - Maximum number of workers. Defaults to hardware concurrency.
   */
  constructor(workerClass, maxWorkers = null) {
    this.workerClass = workerClass
    this.maxWorkers = maxWorkers || Math.max(1, navigator.hardwareConcurrency || 4)
    this.workers = []
    this.availableWorkers = []
    this.taskQueue = []
    this.nextTaskId = 0
    this.initialized = false
  }

  /**
   * Initialize the worker pool by creating and starting workers.
   *
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return

    try {
      // Create workers
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new this.workerClass()

        worker.onmessage = (e) => this.handleWorkerMessage(worker, e)
        worker.onerror = (e) => this.handleWorkerError(worker, e)

        this.workers.push(worker)
        this.availableWorkers.push(worker)
      }

      this.initialized = true
      console.log(`Worker pool initialized with ${this.maxWorkers} workers`)
    } catch (error) {
      console.error('Failed to initialize worker pool:', error)
      throw error
    }
  }

  /**
   * Execute a task on an available worker.
   *
   * @param {string} type - Task type (e.g., 'calcAngularDist', 'calcPos', 'calcProj').
   * @param {object} data - Task data to be sent to the worker.
   * @param {function} [onProgress=null] - Optional callback for progress updates.
   * @returns {Promise<any>} Promise that resolves with the task result.
   */
  executeTask(type, data, onProgress = null) {
    return new Promise((resolve, reject) => {
      const taskId = this.nextTaskId++
      const task = {
        id: taskId,
        type,
        data,
        onProgress,
        resolve,
        reject,
      }

      if (this.availableWorkers.length > 0) {
        this.assignTask(task)
      } else {
        this.taskQueue.push(task)
      }
    })
  }

  /**
   * Execute multiple tasks in parallel across the pool.
   *
   * @param {Array<Object>} tasks - Array of task objects {type, data, onProgress}.
   * @returns {Promise<Array<any>>} Promise that resolves with an array of results.
   */
  async executeParallel(tasks) {
    const promises = tasks.map((task) => this.executeTask(task.type, task.data, task.onProgress))
    return Promise.all(promises)
  }

  /**
   * Assign a task to an available worker.
   *
   * @param {Object} task - The task object.
   * @private
   */
  assignTask(task) {
    const worker = this.availableWorkers.pop()
    worker.currentTask = task

    worker.postMessage({
      id: task.id,
      type: task.type,
      data: task.data,
    })
  }

  /**
   * Handle messages received from workers (results or progress).
   *
   * @param {Worker} worker - The worker that sent the message.
   * @param {MessageEvent} event - The message event.
   * @private
   */
  handleWorkerMessage(worker, event) {
    const { id, result, error, progress } = event.data

    if (worker.currentTask && worker.currentTask.id === id) {
      if (progress !== undefined) {
        if (worker.currentTask.onProgress) {
          worker.currentTask.onProgress(progress)
        }
        return
      }

      if (error) {
        worker.currentTask.reject(new Error(error))
      } else {
        worker.currentTask.resolve(result)
      }

      worker.currentTask = null
      this.availableWorkers.push(worker)

      // Process next task in queue
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift()
        this.assignTask(nextTask)
      }
    }
  }

  /**
   * Handle worker errors.
   *
   * @param {Worker} worker - The worker that errored.
   * @param {ErrorEvent} error - The error event.
   * @private
   */
  handleWorkerError(worker, error) {
    console.error('Worker error:', error)

    if (worker.currentTask) {
      worker.currentTask.reject(error)
      worker.currentTask = null
    }

    // Make worker available again
    if (!this.availableWorkers.includes(worker)) {
      this.availableWorkers.push(worker)
    }
  }

  /**
   * Terminate all workers in the pool and clear queues.
   */
  terminate() {
    this.workers.forEach((worker) => worker.terminate())
    this.workers = []
    this.availableWorkers = []
    this.taskQueue = []
    this.initialized = false
  }

  /**
   * Get the total number of workers in the pool.
   *
   * @returns {number} The worker count.
   */
  getWorkerCount() {
    return this.maxWorkers
  }
}

// Projection worker pool singleton instance
let projectionWorkerPool = null

// Projection worker class
import ProjectionWorker from './projectionWorker.js?worker'

/**
 * Get or create the singleton projection worker pool instance.
 *
 * @returns {Promise<WorkerPool>}
 */
export async function getProjectionWorkerPool() {
  if (!projectionWorkerPool) {
    projectionWorkerPool = new WorkerPool(ProjectionWorker)
    await projectionWorkerPool.init()
  }
  return projectionWorkerPool
}

/**
 * Terminate the singleton projection worker pool.
 */
export function terminateProjectionWorkerPool() {
  if (projectionWorkerPool) {
    projectionWorkerPool.terminate()
    projectionWorkerPool = null
  }
}

export default WorkerPool
