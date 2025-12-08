/**
 * Worker Pool Manager.
 * Manages a pool of Web Workers for parallel computation.
 */

class WorkerPool {
  constructor(workerScript, maxWorkers = null) {
    this.workerScript = workerScript
    this.maxWorkers = maxWorkers || Math.max(1, (navigator.hardwareConcurrency || 4) - 1)
    this.workers = []
    this.availableWorkers = []
    this.taskQueue = []
    this.nextTaskId = 0
    this.initialized = false
  }

  /**
   * Initialize the worker pool.
   */
  async init() {
    if (this.initialized) return

    try {
      // Create workers
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = new Worker(new URL(this.workerScript, import.meta.url), {
          type: 'module',
        })

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
   * @param {string} type - Task type (e.g., 'calcAngularDist', 'calcPos', 'calcProj').
   * @param {object} data - Task data.
   * @returns {Promise} Promise that resolves with the result.
   */
  executeTask(type, data) {
    return new Promise((resolve, reject) => {
      const taskId = this.nextTaskId++
      const task = {
        id: taskId,
        type,
        data,
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
   * Execute multiple tasks in parallel.
   * @param {Array} tasks - Array of {type, data} objects.
   * @returns {Promise<Array>} Promise that resolves with array of results.
   */
  async executeParallel(tasks) {
    const promises = tasks.map((task) => this.executeTask(task.type, task.data))
    return Promise.all(promises)
  }

  /**
   * Assign a task to an available worker.
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
   * Handle message from worker.
   */
  handleWorkerMessage(worker, event) {
    const { id, result, error } = event.data

    if (worker.currentTask && worker.currentTask.id === id) {
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
   * Handle worker error.
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
   * Terminate all workers.
   */
  terminate() {
    this.workers.forEach((worker) => worker.terminate())
    this.workers = []
    this.availableWorkers = []
    this.taskQueue = []
    this.initialized = false
  }

  /**
   * Get number of workers.
   */
  getWorkerCount() {
    return this.maxWorkers
  }
}

// Singleton instance
let projectionWorkerPool = null

/**
 * Get or create the projection worker pool.
 */
export async function getProjectionWorkerPool() {
  if (!projectionWorkerPool) {
    projectionWorkerPool = new WorkerPool('./projectionWorker.js')
    await projectionWorkerPool.init()
  }
  return projectionWorkerPool
}

/**
 * Terminate the projection worker pool.
 */
export function terminateProjectionWorkerPool() {
  if (projectionWorkerPool) {
    projectionWorkerPool.terminate()
    projectionWorkerPool = null
  }
}

export default WorkerPool
