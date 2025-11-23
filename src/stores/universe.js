import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUniverseStore = defineStore('universe', () => {
  const selectedCount = ref(0)
  const multipleSelection = ref(true)

  function setSelectedCount(n) {
    selectedCount.value = n
  }

  function setMultipleSelection(flag) {
    multipleSelection.value = flag
  }

  return {
    selectedCount,
    multipleSelection,
    setSelectedCount,
    setMultipleSelection,
  }
})
