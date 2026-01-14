<template>
  <v-sheet
    :class="['d-flex', xs ? 'flex-row' : 'flex-column', 'toolbox-sheet']"
    elevation="2"
    rounded="!xs && !xm"
    color="surface"
    :width="xs ? '100%' : undefined"
  >
    <v-btn
      icon="mdi-cursor-move"
      variant="text"
      :color="mouseMode === 'move' ? 'primary' : undefined"
      @click="store.setMouseMode('move')"
      title="Move Mode"
      rounded="0"
    ></v-btn>
    <v-btn
      icon="mdi-selection-drag"
      variant="text"
      :color="mouseMode === 'select' ? 'primary' : undefined"
      @click="store.setMouseMode('select')"
      title="Selection Mode"
      rounded="0"
    ></v-btn>
    <v-divider :vertical="xs"></v-divider>
    <v-btn
      icon="mdi-telescope"
      variant="text"
      :color="isSkyMode ? 'primary' : undefined"
      @click="toggleSkyMode"
      title="Sky View"
      rounded="0"
    ></v-btn>
    <v-btn
      icon="mdi-grid"
      variant="text"
      :color="showRefMarks ? 'primary' : undefined"
      @click="toggleRefMarks"
      title="Reference Marks"
      rounded="0"
    ></v-btn>
    <v-btn
      icon="mdi-palette"
      variant="text"
      :color="showRedshiftGradient ? 'primary' : undefined"
      @click="toggleRedshiftGradient"
      title="Redshift Gradient"
      rounded="0"
    ></v-btn>
    <v-btn
      icon="mdi-chart-bar"
      variant="text"
      :color="redshiftDistributionOpened ? 'primary' : undefined"
      @click="redshiftDistributionOpened = true"
      title="Show Redshift Distribution"
      rounded="0"
    ></v-btn>
    <v-btn
      icon="mdi-image-filter-center-focus"
      variant="text"
      @click="$emit('resetView')"
      title="Reset View"
      rounded="0"
    ></v-btn>
  </v-sheet>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'
import { useDisplay } from 'vuetify'

const { xs, xm } = useDisplay()

const store = useUniverseStore()
const { mouseMode, viewerMode, showRefMarks, showRedshiftGradient, redshiftDistributionOpened } =
  storeToRefs(store)

const isSkyMode = computed(() => viewerMode.value === 'sky')

function toggleSkyMode() {
  const newMode = isSkyMode.value ? 'universe' : 'sky'
  store.setViewerMode(newMode)
}

function toggleRefMarks() {
  store.setShowRefMarks(!showRefMarks.value)
}

function toggleRedshiftGradient() {
  store.setShowRedshiftGradient(!showRedshiftGradient.value)
}
</script>

<style scoped>
.toolbox-sheet {
  overflow: auto;
}
/* Desktop/Vertical limits */
.toolbox-sheet.flex-column {
  max-height: 50vh;
  overflow-y: auto;
  overflow-x: hidden;
}
/* Mobile Landscape Vertical limits */
@media (max-width: 960px) and (orientation: landscape) {
  .toolbox-sheet.flex-column {
    max-height: 100vh;
    height: 100%;
  }
}
</style>
