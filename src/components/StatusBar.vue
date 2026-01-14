<template>
  <div
    class="d-flex align-center px-4 w-100 overflow-hidden"
    :class="{ 'py-1': mobile }"
    :style="{ height: mobile ? 'auto' : '32px', userSelect: 'none' }"
    style="box-sizing: border-box"
  >
    <div
      :class="
        mobile
          ? 'd-flex flex-column align-stretch w-100'
          : 'd-flex align-center flex-grow-1 text-caption text-truncate'
      "
      style="min-width: 0"
    >
      <div
        v-if="statusStore.statusMessage !== ''"
        :class="mobile ? 'd-flex flex-column align-stretch' : 'd-flex align-center flex-grow-1'"
        style="min-width: 0"
      >
        <span class="text-truncate flex-shrink-1" :class="{ 'mb-1': mobile }">
          {{ statusStore.statusMessage }}
        </span>
        <v-progress-linear
          v-if="statusStore.progress > 0 && statusStore.progress < 100"
          :class="mobile ? '' : 'mx-2 flex-shrink-0'"
          :model-value="Math.round(statusStore.progress)"
          :style="{
            width: mobile ? '100%' : '200px',
            maxWidth: mobile ? '100%' : '30vw',
            flex: mobile ? 'none' : '0 1 200px',
            minWidth: '50px',
          }"
        ></v-progress-linear>
      </div>
      <span v-else class="text-truncate d-block">{{ infoMessage }}</span>
    </div>
    <div class="d-none d-md-block text-caption text-right ml-4 flex-shrink-0">
      UniverseViewer {{ version }}
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'
import { useStatusStore } from '@/stores/status.js'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()

const universeStore = useUniverseStore()
const { version } = storeToRefs(universeStore)

const statusStore = useStatusStore()
const { infoMessage } = storeToRefs(statusStore)
</script>

<style scoped></style>
