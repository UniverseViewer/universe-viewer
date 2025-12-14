<template>
  <v-footer app height="32">
    <v-row no-gutters class="px-4">
      <v-col class="text-caption">
        <span v-if="busyStore.statusMessage !== ''" class="d-inline-flex align-center text-no-wrap">
          {{ busyStore.statusMessage }}
          <v-progress-linear
            v-if="busyStore.progress > 0 && busyStore.progress < 100"
            class="mx-2"
            :model-value="Math.round(busyStore.progress)"
            style="width: 200px"
          ></v-progress-linear>
        </span>
        <span v-else>{{ infoMessage }}</span>
      </v-col>
      <v-col class="text-right text-caption">UniverseViewer {{ version }}</v-col>
    </v-row>
  </v-footer>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'
import { useBusyStore } from '@/stores/busy.js'

const universeStore = useUniverseStore()
const { version } = storeToRefs(universeStore)

const busyStore = useBusyStore()
const { infoMessage } = storeToRefs(busyStore)
</script>

<style scoped></style>
