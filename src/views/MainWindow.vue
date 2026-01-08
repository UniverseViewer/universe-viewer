<template>
  <v-app>
    <AppHelp v-model="helpOpened" :tab="helpTab" />
    <About v-model="aboutOpened" />
    <RedshiftDistribution v-model="redshiftDistributionOpened" />
    <v-main>
      <v-container fluid class="fill-height pa-0 ma-0">
        <v-row no-gutters style="height: calc(100vh - 32px)">
          <!-- LEFT SIDEBAR -->
          <v-col cols="3" class="pa-2 bg_surface left-panel">
            <v-expansion-panels multiple v-model="opened_panels">
              <!-- CATALOG -->
              <v-expansion-panel title="Catalog" value="catalog">
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
                  <br /><br />
                  <v-number-input
                    v-model="catalogSubsetPercent"
                    label="Subset load percentage"
                    prepend-icon="mdi-set-split"
                    :precision="null"
                    :step="1"
                    :min="1"
                    :max="100"
                    control-variant="split"
                    density="compact"
                  >
                    <template v-slot:append> % </template>
                  </v-number-input>
                  <br />
                  <div class="d-flex align-center justify-space-between text-caption">
                    <span>Current data set: {{ targets ? targets.length.toLocaleString() : 0 }} targets</span>
                    <v-btn
                      icon="mdi-download"
                      variant="text"
                      density="compact"
                      size="small"
                      @click="downloadCatalog"
                      title="Export catalog"
                      :disabled="!targets || targets.length === 0"
                    ></v-btn>
                  </div>
                  <div v-if="targets && targets.length" class="text-caption d-flex align-center justify-space-between">
                    <span>Redshift range: {{ minRedshift.toLocaleString() }} to {{ maxRedshift.toLocaleString() }}</span>
                    <v-tooltip text="Show Redshift Distribution">
                      <template #activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-chart-bar"
                          variant="text"
                          density="compact"
                          size="small"
                          @click="redshiftDistributionOpened = true"
                        ></v-btn>
                      </template>
                    </v-tooltip>
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
                          :min="0"
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
                          :min="Number.EPSILON"
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
                          :min="Number.EPSILON"
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
                        'text-error': constraintError !== null,
                        'text-success': constraintError === null,
                      }"
                    >
                      {{ constraintError === null ? 'Valid' : 'Invalid' }}
                    </span>
                  </div>
                  <br />
                  <v-number-input
                    v-model="h0"
                    label="Hubble constant"
                    :precision="null"
                    :step="0.05"
                    :min="Number.EPSILON"
                    control-variant="split"
                    density="compact"
                  >
                    <template v-slot:append> km&nbsp;s<sup>-1</sup>&nbsp;Mpc<sup>-1</sup> </template>
                  </v-number-input>
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
                    v-model="pendingRa1"
                    :min="0"
                    :max="24"
                    :step="0.1"
                    hide-details
                    density="compact"
                    :disabled="isSkyMode"
                    @start="statusStore.setInteracting(true)"
                    @end="statusStore.setInteracting(false); ra1 = pendingRa1"
                  ></v-slider>
                  <v-number-input
                    v-model="pendingRa1"
                    @update:model-value="ra1 = pendingRa1"
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
                    v-model="pendingDec1"
                    :min="-90"
                    :max="90"
                    :step="1"
                    hide-details
                    density="compact"
                    :disabled="isSkyMode"
                    @start="statusStore.setInteracting(true)"
                    @end="statusStore.setInteracting(false); dec1 = pendingDec1"
                  ></v-slider>
                  <v-number-input
                    v-model="pendingDec1"
                    @update:model-value="dec1 = pendingDec1"
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
                    v-model="pendingBeta"
                    :min="0"
                    :max="24"
                    :step="0.1"
                    hide-details
                    density="compact"
                    :disabled="isSkyMode"
                    @start="statusStore.setInteracting(true)"
                    @end="statusStore.setInteracting(false); beta = pendingBeta"
                  ></v-slider>
                  <v-number-input
                    v-model="pendingBeta"
                    @update:model-value="beta = pendingBeta"
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
                    label="Target point size"
                    v-model="targetPointSize"
                    :max="10"
                    :min="0.5"
                    step="0.1"
                  >
                    <template v-slot:append>
                      {{ targetPointSize.toFixed(1) }}
                    </template>
                  </v-slider>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <v-container>
              <v-switch
                v-model="darkMode"
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
            <ViewerCanvas
              ref="viewer"
              @update-mouse-coords="onMouseCoordsUpdate"
            />

            <!-- RIGHT SIDEBAR (OVERLAY) -->
            <div v-if="constraintError === null" class="right-sidebar">
              <ViewerToolbox @resetView="resetView" />
            </div>
            <div v-if="constraintError === null" class="bottom-right-info">
              <SelectionInfo />
            </div>
            <div v-if="constraintError === null" class="bottom-left-info">
              <SkyCoordinates
                :visible="isSkyMode && mouseRa !== null && mouseDec !== null"
                :mouse-ra="mouseRa || 0"
                :mouse-dec="mouseDec || 0"
              />
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

      <LoadingPopup v-if="isLoading" :title="loadingTitle" :percentage="loadingPercentage" />

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
import { storeToRefs } from 'pinia'
import ViewerCanvas from '@/components/ViewerCanvas.vue'
import { useUniverseStore } from '@/stores/universe.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useStatusStore } from '@/stores/status.js'
import { useThemeStore } from '@/stores/theme.js'

import CatalogBrowser from '@/components/CatalogBrowser.vue'
import About from '@/components/About.vue'
import AppHelp from '@/components/AppHelp.vue'
import RedshiftDistribution from '@/components/RedshiftDistribution.vue'
import ViewerToolbox from '@/components/ViewerToolbox.vue'
import StatusBar from '@/components/StatusBar.vue'
import SelectionInfo from '@/components/SelectionInfo.vue'
import SkyCoordinates from '@/components/SkyCoordinates.vue'
import LoadingPopup from '@/components/LoadingPopup.vue'

import { getSumConsts } from '@/logic/paramsConstraints.js'

import { VIconBtn } from 'vuetify/labs/VIconBtn'

// Stores setup
const store = useUniverseStore()
const {
  lambda,
  omega,
  kappa,
  alpha,
  h0,
  view,
  userRA1,
  userDec1,
  userBeta,
  comovingSpaceFlag,
  precisionEnabled,
  pointSize,
  viewerMode,
  constraintError,
} = storeToRefs(store)

const catalogStore = useCatalogStore()
const { targets, minRedshift, maxRedshift } = storeToRefs(catalogStore)

const statusStore = useStatusStore()
const { busy } = storeToRefs(statusStore)

const themeStore = useThemeStore()
const { darkMode } = storeToRefs(themeStore)

// Side bar
const opened_panels = ref(['catalog', 'parameters', 'view'])

// Viewer Ref
const viewer = ref(null)

// Local State
const selectedConst = ref('kappa')
const redshiftDistributionOpened = ref(false)
const isLoading = ref(false)
const loadingTitle = ref('')
const loadingPercentage = ref(0)

const isSkyMode = computed(() => viewerMode.value === 'sky')

const mouseRa = ref(0)
const mouseDec = ref(0)

function downloadCatalog() {
  let filename = (browsedFile.value === null) ? ((catalogFile.value === undefined) ? '' : catalogFile.value) : browsedFile.value.name
  filename = filename.replace(/\.[^/.]+$/, '')
  filename += '.dat'
  catalogStore.save(filename)
}

function onMouseCoordsUpdate({ x, y }) {
  mouseRa.value = x
  mouseDec.value = y
}

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
const targetPointSize = computed({
  get: () => pointSize.value,
  set: (val) => store.setPointSize(val),
})

// Sliders for lazy update
const pendingRa1 = ref(ra1.value)
const pendingDec1 = ref(dec1.value)
const pendingBeta = ref(beta.value)

watch(ra1, (val) => {
  pendingRa1.value = val
})
watch(dec1, (val) => {
  pendingDec1.value = val
})
watch(beta, (val) => {
  pendingBeta.value = val
})
watch(pendingRa1, (val) => {
  ra1.value = val
})
watch(pendingDec1, (val) => {
  dec1.value = val
})
watch(pendingBeta, (val) => {
  beta.value = val
})

// Computed
const sumConsts = computed(() => getSumConsts(lambda.value, omega.value, kappa.value, alpha.value))

// Initialization
onMounted(() => {
  try {
    // Initialize sliders
    pendingRa1.value = ra1.value
    pendingDec1.value = dec1.value
    pendingBeta.value = beta.value
  } catch (e) {
    console.error(e)
    statusStore.setInfoMessage(`Error: ${e.message}`)
  }
})

// File Loading
const catalogFile = ref(undefined)
const browsedFile = ref(null)
const catalogSubsetPercent = ref(100)
function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  statusStore.increment()
  isLoading.value = true
  loadingTitle.value = 'Reading file...'
  loadingPercentage.value = 0

  const reader = new FileReader()

  reader.onprogress = (e) => {
    if (e.lengthComputable) {
      const pct = (e.loaded / e.total) * 100
      loadingPercentage.value = pct > 100 ? 100 : pct
    }
  }

  reader.onload = (e) => {
    try {
      const content = e.target.result
      statusStore.runBusyTask(() => {
        catalogStore.load(content, catalogSubsetPercent.value)
      }, 'Loading catalog')
    } catch (err) {
      console.error(err)
      statusStore.setInfoMessage(`Error: ${err.message}`)
    } finally {
      statusStore.decrement()
      isLoading.value = false
    }
  }

  reader.onerror = () => {
    statusStore.setInfoMessage('Error reading file')
    statusStore.decrement()
    isLoading.value = false
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

watch(catalogFile, async (newVal) => {
  if (newVal === undefined || newVal === null) return
  statusStore.increment()
  browsedFile.value = null
  isLoading.value = true

  loadingTitle.value = 'Downloading catalog...'
  loadingPercentage.value = 0
  try {
    const response = await fetch('/catalogs/' + newVal)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const contentLength = response.headers.get('content-length')
    const total = contentLength ? parseInt(contentLength, 10) : 0
    let loaded = 0
    const reader = response.body.getReader()
    const chunks = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.length
      if (total) {
        const pct = (loaded / total) * 100
        loadingPercentage.value = pct > 100 ? 100 : pct // can exceed 100% as content-length is compressed size and chunk lenght is real size
      }
    }
    const allChunks = new Uint8Array(loaded)
    let position = 0
    for (const chunk of chunks) {
      allChunks.set(chunk, position)
      position += chunk.length
    }
    const decoder = new TextDecoder('utf-8')
    const content = decoder.decode(allChunks)

    statusStore.runBusyTask(() => {
      catalogStore.load(content, catalogSubsetPercent.value)
    }, "Loading catalog")
  } catch (err) {
    statusStore.setInfoMessage(`Error: ${err.message}`)
  } finally {
    statusStore.decrement()
    isLoading.value = false
  }
})

watch([lambda, omega, kappa, alpha, comovingSpaceFlag], async (newVals, oldVals) => {
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
      statusStore.setInfoMessage('Constraint limit reached')
    }
    return
  }
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
.bottom-right-info {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 10;
}
.bottom-left-info {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 10;
}
</style>
