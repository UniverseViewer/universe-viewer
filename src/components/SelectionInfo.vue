<template>
  <v-sheet
    v-if="selectedCount > 0"
    class="d-flex flex-column pa-2"
    elevation="2"
    rounded
    color="surface"
    max-width="500"
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
        <strong>Angular Distance from Earth:</strong>
        {{ selectedTargets[0].getAngularDist().toFixed(4) }}
      </div>
      <div v-if="comovingSpaceFlag" class="text-caption">
        <strong>Comoving Distance from Earth (dimensionless):</strong>
        {{ distance.toFixed(4) }}
      </div>
      <div v-if="comovingSpaceFlag" class="text-caption">
        <strong>Comoving Distance from Earth (Mpc):</strong>
        {{ distanceMpc.toFixed(4) }}
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
      <div v-if="comovingSpaceFlag">
        <div class="text-caption">
          <strong>Comoving Distance (dimensionless):</strong>
          {{ distance.toFixed(4) }}
        </div>
      </div>
      <div v-if="comovingSpaceFlag">
        <div class="text-caption">
          <strong>Comoving Distance (Mpc):</strong>
          {{ distanceMpc.toFixed(4) }}
        </div>
      </div>
      <div class="text-caption">
        <strong>Geodesic Angular Distance:</strong>
        {{ angularDistanceBetween.toFixed(4) }}
      </div>
      <div class="text-caption">
        <strong>Angular Separation (rad):</strong>
        {{ angularSeparation.toFixed(4) }}
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
        icon="mdi-select-remove"
        variant="text"
        @click="remove"
        title="Remove Selected Objects"
        rounded="0"
        size="small"
      ></v-btn>
      <v-btn
        icon="mdi-select-inverse"
        variant="text"
        @click="reverse"
        title="Reverse Selection"
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
import { computeComovingDistance, comovingDistanceToMpc, computeAngularDistance, computeAngularSeparation } from '@/logic/measures.js'
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useStatusStore } from '@/stores/status.js'

const store = useUniverseStore()
const catalogStore = useCatalogStore()
const statusStore = useStatusStore()
const { kappa, comovingSpaceFlag, h0 } = storeToRefs(store)
const { selectedCount, selectedTargets } = storeToRefs(catalogStore)

const distance = computed(() => {
  // Access selectedTargets to trigger re-evaluation when selection is changed
  selectedTargets.value

  if (selectedCount.value === 2) {
    if (comovingSpaceFlag.value === true) {
      return computeComovingDistance(
        selectedTargets.value[0],
        selectedTargets.value[1],
        kappa.value,
      )
    } else {
      return computeAngularDistance(
        selectedTargets.value[0],
        selectedTargets.value[1],
        kappa.value,
      )
    }
  } else if (selectedCount.value === 1) {
    const tau = selectedTargets.value[0].getAngularDist()
    if (comovingSpaceFlag.value === true) {
      if (kappa.value === 0) return tau
      return tau / Math.sqrt(Math.abs(kappa.value))
    } else {
      return tau
    }
  }
  return 0
})

const distanceMpc = computed(() => {
  return comovingDistanceToMpc(distance.value, h0.value)
})

const angularDistanceBetween = computed(() => {
  // Access selectedTargets to trigger re-evaluation when selection is changed
  selectedTargets.value
  if (selectedCount.value === 2) {
    return computeAngularDistance(selectedTargets.value[0], selectedTargets.value[1], kappa.value)
  }
  return 0
})

const angularSeparation = computed(() => {
  // Access selectedTargets to trigger re-evaluation when selection is changed
  selectedTargets.value
  if (selectedCount.value === 2) {
    return computeAngularSeparation(selectedTargets.value[0], selectedTargets.value[1])
  }
  return 0
})

function highlight() {
  if (store.viewerCanvas && store.viewerCanvas.highlightSelection) {
    store.viewerCanvas.highlightSelection()
  }
}

function clear() {
  statusStore.runBusyTask(catalogStore.clearSelectedTargets)
}

function remove() {
  statusStore.runBusyTask(catalogStore.removeSelectedTargets)
}

function reverse() {
  statusStore.runBusyTask(catalogStore.reverseSelectedTargets)
}

</script>

<style scoped>
/* Add any specific styling here if needed */
</style>
