<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height pa-0 ma-0">
        <v-row no-gutters style="height: 100%">
          <!-- LEFT SIDEBAR -->
          <v-col cols="3" class="pa-2 left-panel" style="overflow-y: auto; height: 100%">
            <!-- DATA LOADING -->
            <v-card elevation="2" class="mb-4">
              <v-card-title class="text-h6">Data</v-card-title>
              <v-card-text>
                <v-file-input
                  label="Load Quasars File"
                  accept=".dat,.txt"
                  @change="onFileChange"
                  density="compact"
                  variant="outlined"
                  prepend-icon="mdi-file-upload"
                ></v-file-input>
                <div class="text-caption">Loaded: {{ quasars ? quasars.length : 0 }} quasars</div>
              </v-card-text>
            </v-card>

            <!-- COSMOLOGICAL CONSTANTS -->
            <v-card elevation="2" class="mb-4">
              <v-card-title class="text-h6">Cosmological constants</v-card-title>
              <v-card-text>
                <v-radio-group v-model="selectedConst" density="compact">
                  <v-radio label="Lambda" value="lambda"></v-radio>
                  <v-radio label="Omega" value="omega"></v-radio>
                  <v-radio label="Kappa" value="kappa"></v-radio>
                  <v-radio label="Alpha" value="alpha"></v-radio>
                </v-radio-group>
                <v-number-input
                  v-model="lambda"
                  :disabled="selectedConst === 'lambda'"
                  label="Lambda"
                  :precision="null"
                  :step="0.05"
                  control-variant="split"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-number-input>
                <v-number-input
                  v-model="omega"
                  :disabled="selectedConst === 'omega'"
                  label="Omega"
                  :precision="null"
                  :step="0.05"
                  control-variant="split"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-number-input>
                <v-number-input
                  v-model="kappa"
                  :disabled="selectedConst === 'kappa'"
                  label="Kappa"
                  :precision="null"
                  :step="0.05"
                  control-variant="split"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-number-input>
                <v-number-input
                  v-model="alpha"
                  :disabled="selectedConst === 'alpha'"
                  label="Alpha"
                  :precision="null"
                  :step="0.05"
                  control-variant="split"
                  density="compact"
                  variant="outlined"
                  class="mb-2"
                ></v-number-input>
                <div class="d-flex justify-space-between text-caption">
                  <span>Sum: {{ sumConsts.toFixed(5) }}</span>
                  <span
                    :class="{ 'text-error': !isConstraintValid, 'text-success': isConstraintValid }"
                  >
                    {{ isConstraintValid ? 'Valid' : 'Invalid' }}
                  </span>
                </div>
              </v-card-text>
            </v-card>

            <!-- VIEW SETTINGS -->
            <v-card elevation="2" class="mb-4">
              <v-card-title class="text-h6">View Settings</v-card-title>
              <v-card-text>
                <v-checkbox
                  v-model="comovingSpaceFlag"
                  label="Comoving Space"
                  density="compact"
                  hide-details
                ></v-checkbox>
                <v-checkbox
                  v-model="precisionEnabled"
                  label="High Precision Integration"
                  density="compact"
                  hide-details
                ></v-checkbox>
                <v-checkbox
                  v-model="showRefMarks"
                  label="Show Reference Marks"
                  density="compact"
                  hide-details
                ></v-checkbox>
                <v-switch
                  v-model="selectionMode"
                  label="Selection Mode"
                  density="compact"
                  color="primary"
                  hide-details
                ></v-switch>

                <v-btn
                  v-if="selectionMode"
                  block
                  class="mt-3"
                  color="warning"
                  @click="store.resetSelection()"
                >
                  Reset Selection
                </v-btn>

                <v-radio-group
                  v-if="selectionMode"
                  v-model="selectionModeType"
                  density="compact"
                  hide-details
                  class="mt-3"
                  @update:modelValue="store.setSelectionModeType(selectionModeType)"
                >
                  <v-radio label="Additive Selection" value="additive"></v-radio>
                  <v-radio label="Replace Selection" value="replace"></v-radio>
                  <v-radio label="Intersection Selection" value="intersection"></v-radio>
                </v-radio-group>

                <v-divider class="my-3"></v-divider>

                <div class="text-subtitle-2 mb-2">Projection</div>
                <v-btn
                  block
                  class="mb-2"
                  :color="isSkyMode ? 'primary' : 'secondary'"
                  @click="toggleSkyMode"
                >
                  {{ isSkyMode ? 'Exit Sky View' : 'Sky View' }}
                </v-btn>
                <v-btn-toggle
                  v-model="view"
                  mandatory
                  density="compact"
                  class="mb-4 d-flex flex-wrap"
                >
                  <v-btn :value="1" size="small">Edge 1</v-btn>
                  <v-btn :value="2" size="small">Edge 2</v-btn>
                  <v-btn :value="3" size="small">Edge 3</v-btn>
                  <v-btn :value="4" size="small">Front 1</v-btn>
                  <v-btn :value="5" size="small">Front 2</v-btn>
                  <v-btn :value="6" size="small">Front 3</v-btn>
                </v-btn-toggle>

                <v-slider
                  label="RA1 (h)"
                  v-model="ra1"
                  :max="24"
                  :min="0"
                  step="0.1"
                  thumb-label
                ></v-slider>
                <v-slider
                  label="Dec1 (deg)"
                  v-model="dec1"
                  :max="90"
                  :min="-90"
                  step="0.1"
                  thumb-label
                ></v-slider>
                <v-slider
                  label="Beta (h)"
                  v-model="beta"
                  :max="24"
                  :min="0"
                  step="0.1"
                  thumb-label
                ></v-slider>

                <v-divider class="my-3"></v-divider>
                <v-slider
                  label="Quasar Point Size"
                  v-model="quasarPointSize"
                  :max="10"
                  :min="1"
                  step="1"
                  thumb-label
                ></v-slider>
              </v-card-text>
              <v-card-actions>
                <v-btn block color="primary" @click="forceUpdate">Update Calculation</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- MAIN VIEWER -->
          <v-col cols="9" class="pa-0 viewer-col" style="height: 100%; position: relative">
            <ViewerCanvas ref="viewer" />
          </v-col>
        </v-row>
      </v-container>

      <!-- BOTTOM INFO BAR -->
      <v-footer app height="32" class="bg-grey-darken-4 text-white">
        <v-row no-gutters class="px-4">
          <v-col class="text-caption">{{ infoLabel }}</v-col>
          <v-col class="text-right text-caption">Universe Viewer Web Port</v-col>
        </v-row>
      </v-footer>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import ViewerCanvas from '@/components/ViewerCanvas.vue'
import { useUniverseStore, UPDATE_ALL, UPDATE_VIEW } from '@/stores/universe.js'
import { loadCatalogADR } from '@/tools/catalog.js'

// Store setup
const store = useUniverseStore()
const {
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
  selectionModeType,
  pointSize,
} = storeToRefs(store)

// Viewer Ref
const viewer = ref(null)

// Local State
const selectedConst = ref('kappa')
const showRefMarks = ref(true)
const selectionMode = ref(false)
const isSkyMode = ref(false)
const infoLabel = ref('Ready.')

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
function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target.result
      const count = loadCatalogADR(content)
      infoLabel.value = `Loaded ${count} quasars.`
      forceUpdate()
    } catch (err) {
      console.error(err)
      infoLabel.value = `Error: ${err.message}`
    }
  }
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
      infoLabel.value = 'Universe Mode'
    } else {
      viewer.value.setModePublic(1) // SKY_MODE
      isSkyMode.value = true
      infoLabel.value = 'Sky Mode'
    }
  }
}

// Watchers
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

watch(selectionMode, (val) => {
  if (viewer.value) viewer.value.enableSelectionMode(val)
})

watch([comovingSpaceFlag, precisionEnabled], () => {
  forceUpdate()
})
</script>

<style scoped>
.left-panel {
  background: #f5f5f5;
  border-right: 1px solid #e0e0e0;
}
.viewer-col {
  background: black;
}
</style>
