<template>
  <v-footer app height="32">
    <v-row no-gutters class="px-4">
      <v-col class="text-caption">
        <span
          v-if="statusStore.statusMessage !== ''"
          class="d-inline-flex align-center text-no-wrap"
        >
          {{ statusStore.statusMessage }}
          <v-progress-linear
            v-if="statusStore.progress > 0 && statusStore.progress < 100"
            class="mx-2"
            :model-value="Math.round(statusStore.progress)"
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
import { useStatusStore } from '@/stores/status.js'

const universeStore = useUniverseStore()
const { version } = storeToRefs(universeStore)

const statusStore = useStatusStore()
const { infoMessage } = storeToRefs(statusStore)
</script>

<style scoped></style>
