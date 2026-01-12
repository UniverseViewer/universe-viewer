<template>
  <v-dialog
    v-model="dialog"
    max-width="800"
    persistent
    @click:outside="hideSplash"
    class="splash-dialog"
  >
    <v-card>
      <v-img
        src="/splash.webp"
        height="400"
        cover
        class="align-start text-white"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      >
        <v-row class="ma-2">
          <v-col cols="9">
            <div class="text-h3 font-weight-bold">Universe Viewer</div>
          </v-col>
          <v-col cols="3" class="text-right">
            <div class="text-subtitle-1">{{ version }}</div>
          </v-col>
        </v-row>
      </v-img>

      <v-card-actions>
        <v-row align="center" class="pa-2 ml-4 mr-4 mt-1 mb-1">
          <div class="w-100">
            <v-btn
              v-if="!showCatalogBrowser"
              variant="text"
              prepend-icon="mdi-library-shelves"
              class="text-none justify-start px-0"
              @click="showCatalogBrowser = true"
            >
              Load catalog
            </v-btn>
            <CatalogBrowser
              v-else
              v-model="catalogFile"
              v-model:opened="showCatalogBrowser"
            />
          </div>
          <div class="w-100">
            <v-btn
              variant="text"
              prepend-icon="mdi-file-upload"
              class="text-none justify-start px-0"
              @click="triggerFileBrowser"
            >
              Browse catalog file
            </v-btn>
            <input
              type="file"
              ref="fileInputRef"
              class="d-none"
              accept=".dat,.txt"
              @change="onFileChange"
            />
          </div>
          <v-btn
            variant="text"
            prepend-icon="mdi-information"
            class="text-none justify-start px-0"
            @click="aboutOpened = true"
          >
            About
          </v-btn>
          <v-row class="w-100 mt-2">
            <v-col cols="6">
              <v-switch
                v-model="darkMode"
                prepend-icon="mdi-theme-light-dark"
                label="Dark mode theme"
                color="success"
                hide-details
                density="compact"
              />
            </v-col>
            <v-col cols="6" class="text-right">
              <v-btn @click="hideSplash">Close</v-btn>
            </v-col>
          </v-row>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useUniverseStore } from '@/stores/universe.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useThemeStore } from '@/stores/theme.js'
import { storeToRefs } from 'pinia'
import CatalogBrowser from '@/components/CatalogBrowser.vue'

const universeStore = useUniverseStore()
const catalogStore = useCatalogStore()
const themeStore = useThemeStore()
const { version, aboutOpened } = storeToRefs(universeStore)
const { catalogFile, browsedFile } = storeToRefs(catalogStore)
const { darkMode } = storeToRefs(themeStore)

const dialog = ref(true)
const showCatalogBrowser = ref(false)
const fileInputRef = ref(null)

const hideSplash = () => {
  dialog.value = false
}

const triggerFileBrowser = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const onFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    browsedFile.value = file
  }
}

watch([catalogFile, browsedFile, aboutOpened], () => {
  hideSplash()
})
</script>

<style scoped>
.splash-dialog {
  user-select: none;
}
</style>
