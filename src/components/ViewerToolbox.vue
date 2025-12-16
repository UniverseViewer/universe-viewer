<template>
  <v-sheet class="d-flex flex-column" elevation="2" rounded color="surface">
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
    <v-divider></v-divider>
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
      title="Reference marks"
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

const store = useUniverseStore()
const { mouseMode, viewerMode, showRefMarks } = storeToRefs(store)

const isSkyMode = computed(() => viewerMode.value === 'sky')

function toggleSkyMode() {
  const newMode = isSkyMode.value ? 'universe' : 'sky'
  store.setViewerMode(newMode)
}

function toggleRefMarks() {
  store.setShowRefMarks(!showRefMarks.value)
}

const emit = defineEmits(['resetView'])
</script>

<style scoped></style>
