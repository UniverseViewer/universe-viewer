<template>
  <v-sheet
    v-if="visible"
    class="d-flex flex-column pa-2"
    elevation="2"
    rounded
    color="surface"
    max-width="300"
  >
    <div class="text-caption">
      <strong>RA:</strong> {{ formatRa(mouseRa) }} ({{ mouseRa.toFixed(4) }} rad)
    </div>
    <div class="text-caption">
      <strong>Dec:</strong> {{ formatDec(mouseDec) }} ({{ mouseDec.toFixed(4) }} rad)
    </div>
  </v-sheet>
</template>

<script setup>
import { formatRa, formatDec } from '@/tools/coordinates.js'

defineOptions({
  name: 'SkyCoordinates',
})

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  mouseRa: {
    type: Number,
    default: 0,
  },
  mouseDec: {
    type: Number,
    default: 0,
  },
})
</script>
