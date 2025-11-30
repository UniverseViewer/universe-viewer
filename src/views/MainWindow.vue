<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height pa-0 ma-0">
        <v-row no-gutters style="height: 100%">
          <!-- LEFT SIDEBAR -->
          <v-col cols="3" class="pa-2 bg_surface left-panel">
            <v-expansion-panels
              multiple
              v-model="opened_panels"
            >
              <!-- DATA LOADING -->
              <v-expansion-panel
                title="Data"
                value="data"
              >
                <v-expansion-panel-text>
                  <CatalogBrowser v-model="catalogFile" />
                  or<br /><br />
                  <v-file-input
                    v-model="browsedFile"
                    label="Browse catalog file"
                    accept=".dat,.txt"
                    @change="onFileChange"
                    prepend-icon="mdi-file-upload"
                    density="compact"
                  ></v-file-input>
                  <div class="text-caption">Loaded: {{ quasars ? quasars.length : 0 }} objects</div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- COSMOLOGICAL CONSTANTS -->
              <v-expansion-panel
                title="Cosmological constants"
                value="constants"
              >
                <v-expansion-panel-text>
                  <v-radio-group v-model="selectedConst" density="compact">
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
                          :disabled="selectedConst === 'lambda'"
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
                          :disabled="selectedConst === 'omega'"
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
                          :disabled="selectedConst === 'kappa'"
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
                          :disabled="selectedConst === 'alpha'"
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
                      :class="{ 'text-error': !isConstraintValid, 'text-success': isConstraintValid }"
                    >
                      {{ isConstraintValid ? 'Valid' : 'Invalid' }}
                    </span>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- VIEW SETTINGS -->
              <v-expansion-panel
                title="View settings"
                value="view"
              >
                <v-expansion-panel-text>
                  <v-switch
                    v-model="comovingSpaceFlag"
                    label="Comoving space"
                    color="success"
                    density="compact"
                  ></v-switch>
                  <v-switch
                    v-model="showRefMarks"
                    label="Show reference marks"
                    color="success"
                    density="compact"
                  ></v-switch>
                  <v-btn
                    block
                    class="mb-2"
                    :color="isSkyMode ? 'primary' : 'secondary'"
                    @click="toggleSkyMode"
                  >
                    {{ isSkyMode ? 'Exit Sky View' : 'Sky View' }}
                  </v-btn>
                  <v-divider class="my-3"></v-divider>
                  <div class="text-subtitle-2 mb-2">Projection</div>
                  <v-btn-toggle
                    v-model="view"
                    mandatory
                    class="mb-4 views"
                  >
                    <v-btn :value="4">Front 1</v-btn>
                    <v-btn :value="5">Front 2</v-btn>
                    <v-btn :value="6">Front 3</v-btn>
                    <v-btn :value="1">Edge 1</v-btn>
                    <v-btn :value="2">Edge 2</v-btn>
                    <v-btn :value="3">Edge 3</v-btn>
                  </v-btn-toggle>
                  <v-slider
                    label="RA1"
                    v-model="ra1"
                    :max="24"
                    :min="0"
                    step="0.1"
                  >
                    <template v-slot:append>
                      {{ ra1.toFixed(1) }}h
                    </template>
                  </v-slider>
                  <v-slider
                    label="Dec1"
                    v-model="dec1"
                    :max="90"
                    :min="-90"
                    step="0.1"
                  >
                    <template v-slot:append>
                      {{ dec1.toFixed(1) }}°
                    </template>
                  </v-slider>
                  <v-slider
                    label="Beta"
                    v-model="beta"
                    :max="24"
                    :min="0"
                    step="0.1"
                  >
                    <template v-slot:append>
                      {{ beta.toFixed(1) }}h
                    </template>
                  </v-slider>
                  <v-divider class="my-3"></v-divider>
                  <v-slider
                    label="Quasar point size"
                    v-model="quasarPointSize"
                    :max="10"
                    :min="1"
                    step="0.5"
                  >
                    <template v-slot:append>
                      {{ quasarPointSize.toFixed(1) }}
                    </template>
                  </v-slider>
                  <v-checkbox
                    v-model="precisionEnabled"
                    label="High precision integration"
                    density="compact"
                    hide-details
                  ></v-checkbox>
                  <v-switch
                    v-model="isDarkTheme"
                    label="Dark mode theme"
                    color="success"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>

          <!-- MAIN VIEWER -->
          <v-col cols="9" class="pa-0 viewer-col" style="height: 100%; position: relative">
            <ViewerCanvas
              ref="viewer"
              :dark-mode="isDarkTheme"
            />
          </v-col>
        </v-row>
      </v-container>

      <!-- BOTTOM INFO BAR -->
      <v-footer app height="32">
        <v-row no-gutters class="px-4">
          <v-col class="text-caption">{{ infoLabel }}</v-col>
          <v-col class="text-right text-caption">Universe Viewer {{ version }}</v-col>
        </v-row>
      </v-footer>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useTheme } from 'vuetify'
import { storeToRefs } from 'pinia'
import ViewerCanvas from '@/components/ViewerCanvas.vue'
import { useUniverseStore, UPDATE_ALL, UPDATE_VIEW } from '@/stores/universe.js'
import CatalogBrowser from '@/components/CatalogBrowser.vue'
import { loadCatalogADR } from '@/tools/catalog.js'

// Store setup
const store = useUniverseStore()
const {
  version,
  quasars,
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
} = storeToRefs(store)

// Side bar
const opened_panels = ref(['data', 'constants', 'view'])

// Viewer Ref
const viewer = ref(null)

// Local State
const selectedConst = ref('kappa')
const showRefMarks = ref(true)
const isSkyMode = ref(false)
const infoLabel = ref('Ready')

// ra1, dec1, beta need to be computed to convert from rad to hours/deg for sliders
const ra1 = computed({
  get: () => (12 * userRA1.value) / Math.PI,
  set: (val) => store.setUserRa1(val),
})
const dec1 = computed({
  get: () => (180 * userDec1.value) / Math.PI,
  set: (val) => store.setUserDec1(val),
})
const beta = computed({
  get: () => (12 * userBeta.value) / Math.PI,
  set: (val) => store.setUserBeta(val),
})
const quasarPointSize = computed({
  get: () => pointSize.value,
  set: (val) => store.setPointSize(val),
})

// Computed
const sumConsts = computed(() => lambda.value - kappa.value + omega.value + alpha.value)
const isConstraintValid = computed(() => Math.abs(sumConsts.value - 1.0) < 1e-4)

// Initialization
onMounted(() => {
  try {
    store.initEnvironment()
    store.setMainWindow(viewer.value) // Pass viewer component ref to store
  } catch (e) {
    console.error(e)
    infoLabel.value = `Error: ${e.message}`
  }
})

// File Loading
const catalogFile = ref(undefined)
const browsedFile = ref(null)
function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target.result
      const count = loadCatalogADR(content)
      infoLabel.value = `Loaded ${count} objects`
      forceUpdate()
    } catch (err) {
      console.error(err)
      infoLabel.value = `Error: ${err.message}`
    }
  }
  catalogFile.value = undefined
  reader.readAsText(file)
}

// Logic Updates
function forceUpdate() {
  try {
    store.update(UPDATE_ALL)
  } catch (e) {
    console.error(e)
    infoLabel.value = 'Update Error: ' + e.message
  }
}

function toggleSkyMode() {
  if (viewer.value) {
    if (isSkyMode.value) {
      viewer.value.setModePublic(0) // UNIVERSE_MODE
      isSkyMode.value = false
    } else {
      viewer.value.setModePublic(1) // SKY_MODE
      isSkyMode.value = true
    }
  }
}

// Watchers
const theme = useTheme()
const isDarkTheme = ref(theme.global.current.value.dark)
watch(isDarkTheme, (val) => {
  theme.change(val ? 'dark' : 'light')
})

watch(catalogFile, (newVal) => {
  if (newVal === undefined || newVal === null) return
  browsedFile.value = null
  fetch('/catalogs/' + newVal)
    .then(response => response.text())
      .then(content => {
        const count = loadCatalogADR(content)
        infoLabel.value = `Loaded ${count} objects`
        forceUpdate()
      })
    .catch(err => infoLabel.value = `Error: ${err.message}`)
})

let cosmoUpdateQueued = false
watch([lambda, omega, kappa, alpha], (newVals, oldVals) => {
  if (Math.abs(sumConsts.value - 1) < 1e-5) return

  let newLambda = lambda.value,
    newOmega = omega.value,
    newKappa = kappa.value,
    newAlpha = alpha.value

  if (selectedConst.value === 'lambda')
    newLambda = 1 + newKappa - newOmega - newAlpha
  else if (selectedConst.value === 'omega')
    newOmega = 1 - newLambda + newKappa - newAlpha
  else if (selectedConst.value === 'kappa')
    newKappa = newLambda + newAlpha + newOmega - 1
  else if (selectedConst.value === 'alpha')
    newAlpha = 1 - newLambda + newKappa - newOmega

  try {
    store.setCosmoConsts(newLambda, newOmega, newKappa, newAlpha)
    // Update the ref that was not selected
    if (selectedConst.value !== 'lambda') lambda.value = newLambda
    if (selectedConst.value !== 'omega') omega.value = newOmega
    if (selectedConst.value !== 'kappa') kappa.value = newKappa
    if (selectedConst.value !== 'alpha') alpha.value = newAlpha
  } catch (e) {
    if (oldVals) {
      lambda.value = oldVals[0]
      omega.value = oldVals[1]
      kappa.value = oldVals[2]
      alpha.value = oldVals[3]
      infoLabel.value = 'Constraint limit reached'
    }
    return
  }

  if (!cosmoUpdateQueued) {
    cosmoUpdateQueued = true
    requestAnimationFrame(() => {
      store.update(UPDATE_ALL)
      cosmoUpdateQueued = false
    })
  }
})

watch(view, (newVal) => {
  store.setView(newVal)
  store.update(UPDATE_VIEW)
})

watch(showRefMarks, (val) => {
  if (viewer.value) viewer.value.setShowReferencesMarksPublic(val)
})

let viewUpdateQueued = false
watch([userRA1, userDec1, userBeta], () => {
  if (!viewUpdateQueued) {
    viewUpdateQueued = true
    requestAnimationFrame(() => {
      store.update(UPDATE_VIEW)
      viewUpdateQueued = false
    })
  }
})

watch([comovingSpaceFlag, precisionEnabled], () => {
  forceUpdate()
})
</script>

<style scoped>
.left-panel {
  overflow-y: auto;
  height: 100vh;
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
</style>
