import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStatusStore = defineStore('status', () => {
  const busyRefCount = ref(0)
  const busy = computed(() => busyRefCount.value > 0)
  const progress = ref(0)
  const statusMessage = ref('')
  const infoMessage = ref('Ready')
  const viewRefreshRate = ref(0)
  const totalComputationDuration = ref(0)
  const projComputationDuration = ref(0)
  const isInteracting = ref(false)

  function increment() {
    busyRefCount.value++
  }

  function decrement() {
    if (busyRefCount.value > 0) {
      busyRefCount.value--
      if (busyRefCount.value === 0) {
        progress.value = 0
        statusMessage.value = ''
      }
    } else {
      // This indicates a potential logic error in the calling code
      console.warn('busyStore.decrement() called when count is already zero.')
    }
  }

  function setInteracting(value) {
    isInteracting.value = value
  }

  function setProgress(value) {
    progress.value = value
  }

  function setStatusMessage(message) {
    statusMessage.value = message
  }

  function setInfoMessage(message) {
    infoMessage.value = message
  }

  function runBusyTask(task, statusMessage = 'Computing') {
    setInfoMessage('Ready')
    setStatusMessage(statusMessage)
    increment()
    return new Promise((resolve, reject) => {
      requestAnimationFrame(() => {
        // Wait GUI render preparation,
        requestAnimationFrame(async () => {
          // and wait GUI render to complete before starting computations
          try {
            await task()
            resolve()
          } catch (e) {
            reject(e)
          } finally {
            setStatusMessage('')
            decrement()
          }
        })
      })
    })
  }

  const isVueImmediateRefreshEnabled = computed(() => viewRefreshRate.value > 100)

  function computationStart() {
    totalComputationDuration.value = performance.now()
  }
  function computationEnd() {
    totalComputationDuration.value = performance.now() - totalComputationDuration.value
  }
  function projComputationStart() {
    projComputationDuration.value = performance.now()
  }
  function projComputationEnd() {
    projComputationDuration.value = performance.now() - projComputationDuration.value
    viewRefreshRate.value = 1.0 / (projComputationDuration.value / 1000)
  }

  return {
    busyRefCount,
    busy,
    increment,
    decrement,
    runBusyTask,
    progress,
    statusMessage,
    setProgress,
    setStatusMessage,
    infoMessage,
    setInfoMessage,
    viewRefreshRate,
    isVueImmediateRefreshEnabled,
    totalComputationDuration,
    computationStart,
    computationEnd,
    projComputationDuration,
    projComputationStart,
    projComputationEnd,
    isInteracting,
    setInteracting,
  }
})
