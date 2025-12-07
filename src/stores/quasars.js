import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useQuasarsStore = defineStore('quasars', () => {
  const selectedCount = ref(0)
  const quasars = shallowRef(null)

  function setSelectedCount(n) {
    selectedCount.value = n
  }

  function setQuasars(qArray) {
    quasars.value = qArray
  }

  return {
    selectedCount,
    quasars,
    // Setters
    setSelectedCount,
    setQuasars,
  }
})
