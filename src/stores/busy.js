import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useBusyStore = defineStore('busy', () => {
  const busyRefCount = ref(0)
  const busy = computed(() => busyRefCount.value > 0)
  const progress = ref(0)
  const statusMessage = ref('')

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

  function setProgress(value) {
    progress.value = value
  }

  function setStatusMessage(message) {
    statusMessage.value = message
  }

  function runBusyTask(task, statusMessage = 'Computing') {
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
  }
})
