<template>
  <v-sheet
    class="d-flex flex-column pa-2"
    elevation="2"
    rounded
    color="surface"
    max-width="500"
  >
    <div class="text-caption d-md-none mb-2">
      <strong>Sky coordinates</strong>
    </div>
    <div v-if="mouseRa !== null && mouseDec !== null">
      <div class="text-caption">
        <strong>RA:</strong> {{ formatRa(mouseRa) }} ({{ mouseRa.toFixed(4) }} rad)
      </div>
      <div class="text-caption">
        <strong>Dec:</strong> {{ formatDec(mouseDec) }} ({{ mouseDec.toFixed(4) }} rad)
      </div>
      <v-divider class="my-2"></v-divider>
    </div>
    <v-container class="pa-0 ma-0">
      <v-btn-toggle v-model="skyProjectionType" mandatory>
        <v-btn
          icon="mdi-rectangle-outline"
          variant="text"
          title="Equirectangular (plate carrée) projection"
          rounded="0"
          size="small"
          value="equirectangular"
        ></v-btn>
        <v-btn
          icon="mdi-ellipse-outline"
          variant="text"
          title="Mollweide projection"
          rounded="0"
          size="small"
          value="mollweide"
        ></v-btn>
      </v-btn-toggle>
    </v-container>
  </v-sheet>
</template>

<script setup>
import { formatRa, formatDec } from '@/tools/coordinates.js'
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'

defineOptions({
  name: 'SkyCoordinates',
})

defineProps({
  mouseRa: {
    type: Number,
    default: null,
  },
  mouseDec: {
    type: Number,
    default: null,
  },
})

const universeStore = useUniverseStore()
const { skyProjectionType } = storeToRefs(universeStore)

</script>
