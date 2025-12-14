<template>
  <v-app>
    <Help v-model="helpOpened" :tab="helpTab" />
    <About v-model="aboutOpened" />
    <v-main>
      <v-container fluid class="fill-height pa-0 ma-0">
        <v-row no-gutters style="height: calc(100%">
          <!-- LEFT SIDEBAR -->
          <v-col cols="3" class="pa-2 bg_surface left-panel">
            <v-expansion-panels multiple v-model="opened_panels">
              <!-- DATA LOADING -->
              <v-expansion-panel title="Data" value="data">
                <v-expansion-panel-text>
                  <CatalogBrowser v-model="catalogFile" />
                  or<br /><br />
                  <div class="d-flex align-center">
                    <v-file-input
                      v-model="browsedFile"
                      label="Browse catalog file"
                      accept=".dat,.txt"
                      @change="onFileChange"
                      prepend-icon="mdi-file-upload"
                      density="compact"
                      hide-details
                      class="flex-grow-1"
                    ></v-file-input>
                    <v-icon-btn
                      @click="openHelp('data_format')"
                      hide-overlay
                      icon="mdi-help"
                      class="ml-2"
                      variant="text"
                      density="compact"
                      size="small"
                    ></v-icon-btn>
                  </div>
                  <br />
                  <div class="text-caption">
                    Loaded: {{ targets ? targets.length.toLocaleString() : 0 }} objects
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- COSMOLOGICAL PARAMETERS -->
              <v-expansion-panel title="Cosmological parameters" value="parameters">
                <v-expansion-panel-text>
                  <v-radio-group v-model="selectedConst" density="compact" :disabled="isSkyMode">
                    <v-row>
                      <v-col cols="2" class="border-e">
                        <v-tooltip text="Lambda as derived parameter">
                          <template #activator="{ props }">
                            <v-radio value="lambda" v-bind="props"></v-radio>
                          </template>
                        </v-tooltip>
                      </v-col>
                      <v-col cols="10">
                        <v-number-input
                          v-model="lambda"
                          :disabled="selectedConst === 'lambda' || isSkyMode"
                          label="Lambda"
                          :precision="null"
                          :step="0.05"
                          control-variant="split"
                          density="compact"
                        ></v-number-input>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="2" class="border-e">
                        <v-tooltip text="Omega as derived parameter">
                          <template #activator="{ props }">
                            <v-radio value="omega" v-bind="props"></v-radio>
                          </template>
                        </v-tooltip>
                      </v-col>
                      <v-col cols="10">
                        <v-number-input
                          v-model="omega"
                          :disabled="selectedConst === 'omega' || isSkyMode"
                          label="Omega"
                          :precision="null"
                          :step="0.05"
                          control-variant="split"
                          density="compact"
                        ></v-number-input>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="2" class="border-e">
                        <v-tooltip text="Kappa as derived parameter">
                          <template #activator="{ props }">
                            <v-radio value="kappa" v-bind="props"></v-radio>
                          </template>
                        </v-tooltip>
                      </v-col>
                      <v-col cols="10">
                        <v-number-input
                          v-model="kappa"
                          :disabled="selectedConst === 'kappa' || isSkyMode"
                          label="Kappa"
                          :precision="null"
                          :step="0.05"
                          control-variant="split"
                          density="compact"
                        ></v-number-input>
                      </v-col>
                    </v-row>
                    <v-row>
                      <v-col cols="2" class="border-e">
                        <v-tooltip text="Alpha as derived parameter">
                          <template #activator="{ props }">
                            <v-radio value="alpha" v-bind="props"></v-radio>
                          </template>
                        </v-tooltip>
                      </v-col>
                      <v-col cols="10">
                        <v-number-input
                          v-model="alpha"
                          :disabled="selectedConst === 'alpha' || isSkyMode"
                          label="Alpha"
                          :precision="null"
                          :step="0.05"
                          control-variant="split"
                          density="compact"
                        ></v-number-input>
                      </v-col>
                    </v-row>
                  </v-radio-group>
                  <div class="d-flex justify-space-between text-caption">
                    <span>Sum: {{ sumConsts.toFixed(5) }}</span>
                    <span
                      :class="{
                        'text-error': !isConstraintValid,
                        'text-success': isConstraintValid,
                      }"
                    >
                      {{ isConstraintValid ? 'Valid' : 'Invalid' }}
                    </span>
                  </div>
                  <v-checkbox
                    v-model="precisionEnabled"
                    label="High precision integration"
                    density="compact"
                    hide-details
                    :disabled="isSkyMode"
                  ></v-checkbox>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- VIEW SETTINGS -->
              <v-expansion-panel title="View settings" value="view">
                <v-expansion-panel-text>
                  <v-switch
                    v-model="comovingSpaceFlag"
                    label="Comoving space"
                    color="success"
                    density="compact"
                    :disabled="isSkyMode"
                  ></v-switch>
                  <v-switch
                    v-model="showRefMarks"
                    label="Show reference marks"
                    color="success"
                    density="compact"
                  ></v-switch>
                  <v-divider class="my-3"></v-divider>
                  <div class="text-subtitle-2 mb-2">Projection</div>
                  <v-btn-toggle v-model="view" mandatory class="mb-4 views" :disabled="isSkyMode">
                    <v-btn :value="4">Front 1</v-btn>
                    <v-btn :value="5">Front 2</v-btn>
                    <v-btn :value="6">Front 3</v-btn>
                    <v-btn :value="1">Edge 1</v-btn>
                    <v-btn :value="2">Edge 2</v-btn>
                    <v-btn :value="3">Edge 3</v-btn>
                  </v-btn-toggle>
                  <v-slider
                    v-model="sliderRa1"
                    :min="0"
                    :max="24"
                    :step="0.1"
                    hide-details
                    density="compact"
                    :disabled="isSkyMode"
                    @end="ra1 = sliderRa1"
                  ></v-slider>
                  <v-number-input
                    v-model="ra1"
                    label="RA1"
                    :precision="null"
                    :min="0"
                    :max="24"
                    :step="1"
                    control-variant="split"
                    density="compact"
                    :disabled="isSkyMode"
                  >
                    <template v-slot:append> h </template>
                  </v-number-input>
                  <v-slider
                    v-model="sliderDec1"
                    :min="-90"
                    :max="90"
                    :step="1"
                    hide-details
                    density="compact"
                    :disabled="isSkyMode"
                    @end="dec1 = sliderDec1"
                  ></v-slider>
                  <v-number-input
                    v-model="dec1"
                    label="Dec1"
                    :precision="null"
                    :min="-90"
                    :max="90"
                    :step="1"
                    control-variant="split"
                    density="compact"
                    :disabled="isSkyMode"
                  >
                    <template v-slot:append> ° </template>
                  </v-number-input>
                  <v-slider
                    v-model="sliderBeta"
                    :min="0"
                    :max="24"
                    :step="0.1"
                    hide-details
                    density="compact"
                    :disabled="isSkyMode"
                    @end="beta = sliderBeta"
                  ></v-slider>
                  <v-number-input
                    v-model="beta"
                    label="Beta"
                    :precision="null"
                    :min="0"
                    :max="24"
                    :step="1"
                    control-variant="split"
                    density="compact"
                    :disabled="isSkyMode"
                  >
                    <template v-slot:append> h </template>
                  </v-number-input>
                  <v-divider class="my-3"></v-divider>
                  <v-slider
                    label="Object point size"
                    v-model="objectPointSize"
                    :max="10"
                    :min="0.5"
                    step="0.1"
                  >
                    <template v-slot:append>
                      {{ objectPointSize.toFixed(1) }}
                    </template>
                  </v-slider>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <v-container>
              <v-switch
                v-model="isDarkTheme"
                prepend-icon="mdi-theme-light-dark"
                label="Dark mode theme"
                color="success"
              />
              <v-btn @click="openHelp()" icon="mdi-help"> </v-btn>
              <v-btn @click="aboutOpened = true" icon="mdi-information"> </v-btn>
              <v-btn
                icon="mdi-github"
                variant="elevated"
                :color="$vuetify.theme.current.dark ? 'surface' : 'white'"
                href="https://github.com/UniverseViewer/universe-viewer"
                target="_blank"
                rel="noopener"
              ></v-btn>
            </v-container>
          </v-col>

          <!-- MAIN VIEWER -->
          <v-col cols="9" class="pa-0 viewer-col" style="height: 100%; position: relative">
            <ViewerCanvas ref="viewer" :dark-mode="isDarkTheme" />

            <!-- RIGHT SIDEBAR (OVERLAY) -->
            <div class="right-sidebar">
              <ViewerToolbox @resetView="resetView" />
            </div>
          </v-col>
        </v-row>
      </v-container>

      <v-overlay
        :model-value="busy"
        scrim="transparent"
        class="align-center justify-center"
        persistent
      >
      </v-overlay>

      <!-- BOTTOM INFO BAR -->
      <StatusBar />
    </v-main>
  </v-app>
</template>

<script setup>
/*
 * Copyright (C) 2025 Mathieu Abati <mathieu.abati@gmail.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 */

import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { storeToRefs } from 'pinia'
import ViewerCanvas from '@/components/ViewerCanvas.vue'
import { useUniverseStore } from '@/stores/universe.js'
import { useTargetsStore } from '@/stores/targets.js'
import { useStatusStore } from '@/stores/status.js'

import CatalogBrowser from '@/components/CatalogBrowser.vue'
import { loadCatalogADR } from '@/tools/catalog.js'
import About from '@/components/About.vue'
import Help from '@/components/Help.vue'
import ViewerToolbox from '@/components/ViewerToolbox.vue'
import StatusBar from '@/components/StatusBar.vue'

import { VIconBtn } from 'vuetify/labs/VIconBtn'

// Stores setup
const store = useUniverseStore()
const {
  lambda,
  omega,
  kappa,
  alpha,
  view,
  userRA1,
  userDec1,
  userBeta,
  comovingSpaceFlag,
  precisionEnabled,
  pointSize,
  viewerMode,
} = storeToRefs(store)

const targetsStore = useTargetsStore()
const { targets } = storeToRefs(targetsStore)

const statusStore = useStatusStore()
const { busy } = storeToRefs(statusStore)

// Side bar
const opened_panels = ref(['data', 'parameters', 'view'])

// Viewer Ref
const viewer = ref(null)

// Local State
const selectedConst = ref('kappa')
const showRefMarks = ref(true)

const isSkyMode = computed(() => viewerMode.value === 'sky')

// ra1, dec1, beta need to be computed to convert from rad to hours/deg for sliders
const ra1 = computed({
  get: () => Math.round(((12 * userRA1.value) / Math.PI) * 10) / 10,
  set: (val) => store.setUserRa1(val),
})
const dec1 = computed({
  get: () => Math.round(((180 * userDec1.value) / Math.PI) * 10) / 10,
  set: (val) => store.setUserDec1(val),
})
const beta = computed({
  get: () => Math.round(((12 * userBeta.value) / Math.PI) * 10) / 10,
  set: (val) => store.setUserBeta(val),
})
const objectPointSize = computed({
  get: () => pointSize.value,
  set: (val) => store.setPointSize(val),
})

// Sliders for lazy update
const sliderRa1 = ref(ra1.value)
const sliderDec1 = ref(dec1.value)
const sliderBeta = ref(beta.value)

watch(ra1, (val) => {
  sliderRa1.value = val
})
watch(dec1, (val) => {
  sliderDec1.value = val
})
watch(beta, (val) => {
  sliderBeta.value = val
})

// Computed
const sumConsts = computed(() => lambda.value - kappa.value + omega.value + alpha.value)
const isConstraintValid = computed(() => Math.abs(sumConsts.value - 1.0) < 1e-4)

// Initialization
onMounted(() => {
  try {
    store.initialize()
    // Initialize sliders
    sliderRa1.value = ra1.value
    sliderDec1.value = dec1.value
    sliderBeta.value = beta.value
  } catch (e) {
    console.error(e)
    statusStore.setInfoMessage(`Error: ${e.message}`)
  }
})

// File Loading
const catalogFile = ref(undefined)
const browsedFile = ref(null)
function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  statusStore.increment()

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target.result
      const loadedTargets = loadCatalogADR(content)
      targetsStore.setTargets(loadedTargets)
      targetsStore.setSelectedCount(0)
      statusStore.setInfoMessage(`Loaded ${loadedTargets.length.toLocaleString()} objects`)
    } catch (err) {
      console.error(err)
      statusStore.setInfoMessage(`Error: ${err.message}`)
    } finally {
      statusStore.decrement()
    }
  }
  catalogFile.value = undefined
  reader.readAsText(file)
}

// Help
const helpOpened = ref(false)
const helpTab = ref(undefined)

function openHelp(tab = 'controls') {
  helpOpened.value = true
  helpTab.value = tab
}

const aboutOpened = ref(false)

// Logic Updates

function resetView() {
  if (viewer.value) {
    viewer.value.resetView()
  }
}

// Watchers
const theme = useTheme()

// Initialize from localStorage
const savedTheme = localStorage.getItem('theme_mode')
if (savedTheme) {
  theme.global.name.value = savedTheme
}

const isDarkTheme = ref(theme.global.current.value.dark)

// Sync ref if theme changed externally (e.e. initial load)
watch(
  () => theme.global.current.value.dark,
  (val) => {
    isDarkTheme.value = val
  },
)

watch(isDarkTheme, (val) => {
  const newTheme = val ? 'dark' : 'light'
  theme.global.name.value = newTheme
  localStorage.setItem('theme_mode', newTheme)
})

watch(catalogFile, (newVal) => {
  if (newVal === undefined || newVal === null) return
  statusStore.increment()
  browsedFile.value = null
  fetch('/catalogs/' + newVal)
    .then((response) => response.text())
    .then((content) => {
      const loadedTargets = loadCatalogADR(content)
      targetsStore.setTargets(loadedTargets)
      targetsStore.setSelectedCount(0)
      statusStore.setInfoMessage(`Loaded ${loadedTargets.length.toLocaleString()} objects`)
    })
    .catch((err) => statusStore.setInfoMessage(`Error: ${err.message}`))
    .finally(() => {
      statusStore.decrement()
    })
})

watch([lambda, omega, kappa, alpha], async (newVals, oldVals) => {
  if (Math.abs(sumConsts.value - 1) < 1e-5) return

  let newLambda = lambda.value,
    newOmega = omega.value,
    newKappa = kappa.value,
    newAlpha = alpha.value

  if (selectedConst.value === 'lambda') newLambda = 1 + newKappa - newOmega - newAlpha
  else if (selectedConst.value === 'omega') newOmega = 1 - newLambda + newKappa - newAlpha
  else if (selectedConst.value === 'kappa') newKappa = newLambda + newAlpha + newOmega - 1
  else if (selectedConst.value === 'alpha') newAlpha = 1 - newLambda + newKappa - newOmega

  try {
    store.setCosmoParams(newLambda, newOmega, newKappa, newAlpha)
    // Update the ref that was not selected
    if (selectedConst.value !== 'lambda') lambda.value = newLambda
    if (selectedConst.value !== 'omega') omega.value = newOmega
    if (selectedConst.value !== 'kappa') kappa.value = newKappa
    if (selectedConst.value !== 'alpha') alpha.value = newAlpha
  } catch {
    if (oldVals) {
      lambda.value = oldVals[0]
      omega.value = oldVals[1]
      kappa.value = oldVals[2]
      alpha.value = oldVals[3]
      statusStore.setInfoMessage('Constraint limit reached')
    }
    return
  }
})

watch(showRefMarks, (val) => {
  if (viewer.value) viewer.value.setShowReferencesMarksPublic(val)
})
</script>

<style scoped>
.left-panel {
  overflow-y: auto;
  height: calc(100vh - 32px);
}
.viewer-col {
  background: black;
}
.views {
  display: flex !important;
  flex-wrap: wrap !important;
}
.views .v-btn {
  flex: 0 0 33.33%;
  max-width: 33.33%;
  box-sizing: border-box;
}
.right-sidebar {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}
</style>
