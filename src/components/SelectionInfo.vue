<template>
  <v-sheet
    v-if="selectedCount > 0"
    class="d-flex flex-column pa-2"
    elevation="2"
    rounded
    color="surface"
    max-width="400"
  >
    <div v-if="selectedCount === 1 && selectedTargets && selectedTargets[0]">
      <div class="text-caption"><strong>Selected:</strong> 1 object</div>
      <v-divider class="my-2"></v-divider>
      <div class="text-caption">
        <strong>RA:</strong> {{ formatRa(selectedTargets[0].getAscension()) }} ({{
          selectedTargets[0].getAscension().toFixed(4)
        }}
        rad)
      </div>
      <div class="text-caption">
        <strong>Dec:</strong> {{ formatDec(selectedTargets[0].getDeclination()) }} ({{
          selectedTargets[0].getDeclination().toFixed(4)
        }}
        rad)
      </div>
      <div class="text-caption">
        <strong>Redshift:</strong> {{ selectedTargets[0].getRedshift().toFixed(4) }}
      </div>
      <div class="text-caption">
        <strong>Angular Distance:</strong>
        {{ selectedTargets[0].getAngularDist().toFixed(4) }}
      </div>
      <div class="text-caption">
        <strong>X:</strong> {{ selectedTargets[0].getPos().x.toFixed(4) }}
      </div>
      <div class="text-caption">
        <strong>Y:</strong> {{ selectedTargets[0].getPos().y.toFixed(4) }}
      </div>
      <div class="text-caption">
        <strong>Z:</strong> {{ selectedTargets[0].getPos().z.toFixed(4) }}
      </div>
      <div class="text-caption">
        <strong>T:</strong> {{ selectedTargets[0].getPos().t.toFixed(4) }}
      </div>
    </div>
    <div
      v-else-if="selectedCount === 2 && selectedTargets && selectedTargets[0] && selectedTargets[1]"
    >
      <div class="text-caption"><strong>Selected:</strong> 2 objects</div>
      <v-divider class="my-2"></v-divider>
      <div class="text-caption">
        <strong v-if="comovingSpaceFlag">Comoving Distance:</strong>
        <strong v-else>Reference Distance:</strong>
        {{ distance }}
      </div>
    </div>
    <div v-else>
      <div class="text-caption"><strong>Selected:</strong> {{ selectedCount }} objects</div>
    </div>
    <v-divider class="my-2"></v-divider>
    <v-container class="pa-0 ma-0">
      <v-btn
        icon="mdi-crosshairs"
        variant="text"
        @click="highlight"
        title="Highlight Selected Objects"
        rounded="0"
        size="small"
      ></v-btn>
      <v-btn
        icon="mdi-close"
        variant="text"
        @click="clear"
        title="Clear Selection"
        rounded="0"
        size="small"
      ></v-btn>
    </v-container>
  </v-sheet>
</template>

<script setup>
import { computed } from 'vue'
import { formatRa, formatDec } from '@/tools/coordinates.js'
import { computeComovingDistance, computeReferenceDistance } from '@/logic/measures.js'
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'
import { useTargetsStore } from '@/stores/targets.js'

const store = useUniverseStore()
const targetsStore = useTargetsStore()
const { kappa, comovingSpaceFlag } = storeToRefs(store)
const { selectedCount, selectedTargets, lastUpdate } = storeToRefs(targetsStore)

const distance = computed(() => {
  // Access lastUpdate to trigger re-evaluation when targets are updated
  lastUpdate.value

  if (comovingSpaceFlag.value === true) {
    return computeComovingDistance(selectedTargets.value[0], selectedTargets.value[1], kappa.value)
  } else {
    return computeReferenceDistance(selectedTargets.value[0], selectedTargets.value[1], kappa.value)
  }
})

function highlight() {
  if (store.viewerCanvas && store.viewerCanvas.highlightSelection) {
    store.viewerCanvas.highlightSelection()
  }
}

function clear() {
  if (store.viewerCanvas && store.viewerCanvas.clearSelection) {
    store.viewerCanvas.clearSelection()
  }
}
</script>

<style scoped>
/* Add any specific styling here if needed */
</style>
