import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useTargetsStore = defineStore('targets', () => {
  const selectedCount = ref(0)
  const targets = shallowRef(null)

  function setSelectedCount(n) {
    selectedCount.value = n
  }

  function setTargets(tArray) {
    targets.value = tArray
  }

  return {
    selectedCount,
    targets,
    // Setters
    setSelectedCount,
    setTargets,
  }
})
