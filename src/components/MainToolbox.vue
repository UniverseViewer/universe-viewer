<template>
  <div class="sidebar-layout d-flex fill-height">
    <!-- Mobile scroll slider -->
    <div v-if="mobile" class="sidebar-scroll-wrapper">
      <v-slider
        v-model="sidebarScroll"
        direction="vertical"
        :max="maxSidebarScroll"
        min="0"
        step="1"
        hide-details
        class="sidebar-scroll-slider"
        @update:model-value="onSidebarScrollChange"
      ></v-slider>
    </div>

    <div
      class="sidebar-scroll-area flex-grow-1"
      :class="{ 'mobile-scroll': mobile }"
      ref="scrollArea"
    >
      <div class="sidebar-content pa-2" ref="sidebarContent">
        <!-- Mobile-only SkyCoordinates -->
        <div v-if="constraintError === null" class="d-md-none mb-2">
          <SkyCoordinates v-if="isSkyMode" />
        </div>
        <!-- Mobile-only SelectionInfo -->
        <div v-if="constraintError === null" class="d-md-none mb-2">
          <SelectionInfo />
        </div>
        <v-expansion-panels multiple v-model="opened_panels">
          <!-- CATALOG -->
          <v-expansion-panel title="Catalog" value="catalog">
            <v-expansion-panel-text>
              <CatalogBrowser v-model="catalogFile" v-model:opened="catalogBrowserOpened" />
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
                <span>
                  Current data set:
                  {{ targets ? targets.length.toLocaleString() : 0 }} targets
                </span>
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
              <div
                v-if="targets && targets.length"
                class="text-caption d-flex align-center justify-space-between"
              >
                <span>
                  Redshift range: {{ minRedshift.toLocaleString() }} to
                  {{ maxRedshift.toLocaleString() }}
                </span>
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
                <template v-slot:append>
                  km&nbsp;s<sup>-1</sup>&nbsp;Mpc<sup>-1</sup>
                </template>
              </v-number-input>
              <v-checkbox
                v-model="precisionEnabled"
                label="Romberg's high precision integration"
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
                @end="applyRa1()"
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
                @end="applyDec1()"
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
                @end="applyBeta()"
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
                :min="0.1"
                step="0.1"
                hide-details
              >
                <template v-slot:append>
                  <v-number-input
                    v-model="targetPointSize"
                    :precision="null"
                    :min="0.1"
                    :max="10"
                    :step="0.1"
                    control-variant="stacked"
                    density="compact"
                    hide-details
                  >
                  </v-number-input>
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
      </div>
    </div>
    <LoadingPopup v-if="isLoading" :title="loadingTitle" :percentage="loadingPercentage" />
  </div>
</template>

<script setup>
/*
 * Copyright (C) 2025-2026 Mathieu Abati <mathieu.abati@gmail.com>
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

import { ref, computed, watch, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'
import { VIconBtn } from 'vuetify/labs/VIconBtn'

import CatalogBrowser from '@/components/CatalogBrowser.vue'
import SelectionInfo from '@/components/SelectionInfo.vue'
import SkyCoordinates from '@/components/SkyCoordinates.vue'
import LoadingPopup from '@/components/LoadingPopup.vue'

import { useUniverseStore } from '@/stores/universe.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useStatusStore } from '@/stores/status.js'
import { useThemeStore } from '@/stores/theme.js'
import { getSumConsts } from '@/logic/paramsConstraints.js'

const { mobile } = useDisplay()

defineOptions({
  name: 'MainToolbox',
})

// Stores
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
  redshiftDistributionOpened,
  helpOpened,
  aboutOpened,
  constraintError,
} = storeToRefs(store)

const catalogStore = useCatalogStore()
const { catalogFile, browsedFile, targets, minRedshift, maxRedshift, selectedCount } =
  storeToRefs(catalogStore)

const statusStore = useStatusStore()

const themeStore = useThemeStore()
const { darkMode } = storeToRefs(themeStore)

// State
const opened_panels = ref(['catalog', 'parameters', 'view'])
const catalogBrowserOpened = ref(false)
const selectedConst = ref('kappa')
const catalogSubsetPercent = ref(100)
const isLoading = ref(false)
const loadingTitle = ref('')
const loadingPercentage = ref(0)

const isSkyMode = computed(() => viewerMode.value === 'sky')
const sumConsts = computed(() => getSumConsts(lambda.value, omega.value, kappa.value, alpha.value))

// Scroll logic
const scrollArea = ref(null)
const sidebarContent = ref(null)
const sidebarScroll = ref(0)
const maxSidebarScroll = ref(0)

function onSidebarScrollChange(val) {
  if (scrollArea.value) {
    scrollArea.value.scrollTop = maxSidebarScroll.value - val
  }
}

function updateMaxScroll() {
  if (scrollArea.value && sidebarContent.value) {
    const containerHeight = scrollArea.value.clientHeight
    const contentHeight = sidebarContent.value.scrollHeight
    maxSidebarScroll.value = Math.max(0, contentHeight - containerHeight)
    sidebarScroll.value = maxSidebarScroll.value - scrollArea.value.scrollTop
  }
}

watch(selectedCount, (newVal) => {
  if (newVal > 0 && mobile.value) {
    if (scrollArea.value) {
      scrollArea.value.scrollTop = 0
      sidebarScroll.value = maxSidebarScroll.value
    }
  }
})

onMounted(() => {
  if (sidebarContent.value) {
    const resizeObserver = new ResizeObserver(() => {
      updateMaxScroll()
    })
    resizeObserver.observe(sidebarContent.value)
  }
  updateMaxScroll()
})

// Sliders logic
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

onMounted(() => {
  pendingRa1.value = ra1.value
  pendingDec1.value = dec1.value
  pendingBeta.value = beta.value
})

function applyRa1() {
  statusStore.setInteracting(false)
  ra1.value = pendingRa1.value
}

function applyDec1() {
  statusStore.setInteracting(false)
  dec1.value = pendingDec1.value
}

function applyBeta() {
  statusStore.setInteracting(false)
  beta.value = pendingBeta.value
}

// Actions
function openHelp(tab = 'overview') {
  helpOpened.value = true
  emit('open-help', tab)
}

const emit = defineEmits(['open-help'])

function downloadCatalog() {
  let filename =
    browsedFile.value === null
      ? catalogFile.value === undefined
        ? ''
        : catalogFile.value
      : browsedFile.value.name
  filename = filename.replace(/\.[^/.]+$/, '')
  filename += '.dat'
  catalogStore.save(filename)
}

function loadUserCatalog(file) {
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

  reader.readAsText(file)
}

function onFileChange(event) {
  const file = event.target.files[0]
  if (file) {
    loadUserCatalog(file)
  }
}

watch(browsedFile, (newFile) => {
  if (newFile) {
    loadUserCatalog(newFile)
  }
})

watch(catalogFile, async (newVal) => {
  if (newVal === undefined || newVal === null) return
  statusStore.increment()
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
        loadingPercentage.value = pct > 100 ? 100 : pct
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
    }, 'Loading catalog')
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
.sidebar-layout {
  height: 100%;
  width: 100%;
}
.sidebar-scroll-area {
  overflow-y: auto;
  height: 100%;
}
.sidebar-scroll-area.mobile-scroll {
  overflow-y: hidden !important;
  touch-action: none;
}
.sidebar-scroll-wrapper {
  margin-top: 5%;
  margin-bottom: auto;
  height: 70%;
  width: 32px;
  flex-shrink: 0;
  display: flex;
  min-height: 0;
}
.sidebar-scroll-slider {
  height: 100% !important;
  width: 100%;
  min-height: 0 !important;
}
.sidebar-scroll-slider :deep(.v-input__control),
.sidebar-scroll-slider :deep(.v-input__slot) {
  height: 100% !important;
  min-height: 0 !important;
}
:deep(.sidebar-scroll-slider .v-slider-track) {
  width: 4px !important;
}
:deep(.sidebar-scroll-slider .v-slider-thumb) {
  width: 20px !important;
  height: 20px !important;
}
:deep(.sidebar-scroll-slider .v-slider-track__fill),
:deep(.sidebar-scroll-slider .v-slider-track__background) {
  height: 6px;
  opacity: 100%;
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
</style>
