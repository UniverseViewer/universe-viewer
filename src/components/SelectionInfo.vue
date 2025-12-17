<template>
  <v-sheet
    v-if="selectedCount > 0"
    class="d-flex flex-column pa-2"
    elevation="2"
    rounded
    color="surface"
    max-width="300"
  >
    <div v-if="selectedCount === 1 && selectedTarget">
      <div class="text-caption"><strong>Selected:</strong> 1 object</div>
      <v-divider class="my-2"></v-divider>
      <div class="text-caption">
        <strong>RA:</strong> {{ formatRa(selectedTarget.getAscension()) }} ({{
          selectedTarget.getAscension().toFixed(4)
        }}
        rad)
      </div>
      <div class="text-caption">
        <strong>Dec:</strong> {{ formatDec(selectedTarget.getDeclination()) }} ({{
          selectedTarget.getDeclination().toFixed(4)
        }}
        rad)
      </div>
      <div class="text-caption">
        <strong>Redshift:</strong> {{ selectedTarget.getRedshift().toFixed(4) }}
      </div>
      <div class="text-caption">
        <strong>Angular Distance:</strong>
        {{ selectedTarget.getAngularDist().toFixed(4) }}
      </div>
      <div class="text-caption"><strong>X:</strong> {{ selectedTarget.getPos().x.toFixed(4) }}</div>
      <div class="text-caption"><strong>Y:</strong> {{ selectedTarget.getPos().y.toFixed(4) }}</div>
      <div class="text-caption"><strong>Z:</strong> {{ selectedTarget.getPos().z.toFixed(4) }}</div>
      <div class="text-caption"><strong>T:</strong> {{ selectedTarget.getPos().t.toFixed(4) }}</div>
    </div>
    <div v-else>
      <div class="text-caption"><strong>Selected:</strong> {{ selectedCount }} objects</div>
    </div>
  </v-sheet>
</template>

<script setup>
import { defineProps } from 'vue'
import { formatRa, formatDec } from '@/tools/coordinates.js'

defineProps({
  selectedCount: {
    type: Number,
    required: true,
  },
  selectedTarget: {
    type: Object,
    default: null,
  },
})
</script>

<style scoped>
/* Add any specific styling here if needed */
</style>
