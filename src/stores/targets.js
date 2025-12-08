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

  function serialize() {
    if (!targets.value) return []
    return targets.value.map((t) => ({
      ascension: t.getAscension(),
      declination: t.getDeclination(),
      redshift: t.getRedshift(),
      angularDistance: t.getAngularDist(),
      pos: t.getPos()
        ? {
            x: t.getPos().getX(),
            y: t.getPos().getY(),
            z: t.getPos().getZ(),
            t: t.getPos().getT(),
          }
        : null,
    }))
  }

  return {
    selectedCount,
    targets,
    // Setters
    setSelectedCount,
    setTargets,
    serialize,
  }
})
