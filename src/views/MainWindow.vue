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
                <div class="text-caption">Loaded: {{ quasarsCount }} quasars</div>
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

                <v-slider
                  v-model="lambda"
                  :disabled="selectedConst === 'lambda'"
                  :min="-2"
                  :max="3"
                  step="0.0001"
                  label="Lambda"
                  thumb-label
                ></v-slider>
                <v-slider
                  v-model="omega"
                  :disabled="selectedConst === 'omega'"
                  :min="0.0001"
                  :max="3"
                  step="0.0001"
                  label="Omega"
                  thumb-label
                ></v-slider>
                <v-slider
                  v-model="kappa"
                  :disabled="selectedConst === 'kappa'"
                  :min="-2"
                  :max="3"
                  step="0.0001"
                  label="Kappa"
                  thumb-label
                ></v-slider>
                <v-slider
                  v-model="alpha"
                  :disabled="selectedConst === 'alpha'"
                  :min="-2"
                  :max="3"
                  step="0.0001"
                  label="Alpha"
                  thumb-label
                ></v-slider>

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
                  v-model="comovingSpace"
                  label="Comoving Space"
                  density="compact"
                  hide-details
                ></v-checkbox>
                <v-checkbox
                  v-model="precision"
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
                  v-model="currentView"
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
import ViewerCanvas from '@/components/ViewerCanvas.vue'
import * as Environment from '@/logic/environment.js'
import { readTxtFileContent } from '@/logic/readFile.js'

// Viewer Ref
const viewer = ref(null)

// State
const lambda = ref(1.2)
const omega = ref(0.2)
const kappa = ref(0.40005)
const alpha = ref(0.00005)
const selectedConst = ref('kappa')

const currentView = ref(1)
const ra1 = ref(0)
const dec1 = ref(0)
const beta = ref(0)

const comovingSpace = ref(false)
const precision = ref(false)
const showRefMarks = ref(true)
const isSkyMode = ref(false)

const quasarsCount = ref(0)
const infoLabel = ref('Ready.')

// Computed
const sumConsts = computed(() => lambda.value - kappa.value + omega.value + alpha.value)
const isConstraintValid = computed(() => Math.abs(sumConsts.value - 1.0) < 1e-4)

// Initialization
onMounted(() => {
  // Initialize Environment with defaults
  try {
    Environment.initEnvironment()
    // Sync local state with Environment defaults if needed,
    // but we set our refs to match Environment.initEnvironment defaults roughly
    // Environment defaults: 1.2, 0.2, 0.40005, 0.00005
    updateEnvironmentConstants()
  } catch (e) {
    console.error(e)
  }
})

// File Loading
function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    const count = readTxtFileContent(content)
    quasarsCount.value = count
    infoLabel.value = `Loaded ${count} quasars.`
    forceUpdate()
  }
  reader.readAsText(file)
}

// Logic Updates
function updateEnvironmentConstants() {
  try {
    Environment.setCosmoConsts(lambda.value, omega.value, kappa.value, alpha.value)
    infoLabel.value = 'Constants updated.'
  } catch (e) {
    console.error('MainWindow: updateEnvironmentConstants error:', e)
    infoLabel.value = 'Error: ' + e.message
  }
}

function forceUpdate() {
  try {
    // Push all params to Environment
    updateEnvironmentConstants()
    Environment.setUserRa1(ra1.value)
    Environment.setUserDec1(dec1.value)
    Environment.setUserBeta(beta.value)
    Environment.setView(currentView.value)

    // Checkboxes
    Environment.setComovingSpace(comovingSpace.value)
    Environment.enablePrecision(precision.value)

    // Trigger calculation
    Environment.update(Environment.UPDATE_ALL)

    // Update viewer specific toggles
    if (viewer.value) {
      viewer.value.setModePublic(0) // Always Universe Mode for now
      viewer.value.setShowReferencesMarksPublic(showRefMarks.value)
    }
  } catch (e) {
    console.error(e)
    infoLabel.value = 'Update Error: ' + e.message
  }
}

function toggleSkyMode() {
  if (viewer.value) {
    if (isSkyMode.value) {
      // Exit Sky Mode
      viewer.value.setModePublic(0) // UNIVERSE_MODE
      isSkyMode.value = false
      infoLabel.value = 'Universe Mode'
    } else {
      // Enter Sky Mode
      viewer.value.setModePublic(1) // SKY_MODE
      isSkyMode.value = true
      infoLabel.value = 'Sky Mode'
    }
  }
}

// Watchers for automatic updates (optional, can rely on button)
watch([lambda, omega, kappa, alpha], (newVals, oldVals) => {
  // Auto-balance
  const sum = lambda.value - kappa.value + omega.value + alpha.value
  // console.log('Watcher: sum diff', Math.abs(sum - 1))
  if (Math.abs(sum - 1) < 1e-5) return // already balanced

  console.log('Watcher: balancing...', selectedConst.value)

  // Simple balancing logic from Java port
  if (selectedConst.value === 'lambda') lambda.value = 1 + kappa.value - omega.value - alpha.value
  else if (selectedConst.value === 'omega')
    omega.value = 1 - lambda.value + kappa.value - alpha.value
  else if (selectedConst.value === 'kappa')
    kappa.value = lambda.value + alpha.value + omega.value - 1
  else if (selectedConst.value === 'alpha')
    alpha.value = 1 - lambda.value + kappa.value - omega.value

  console.log('Watcher: balanced kappa to', kappa.value)

  // Check constraints
  const L = lambda.value
  const O = omega.value
  const K = kappa.value

  const lhs = (27.0 / 4.0) * L * O * O
  const rhs = K * K * K

  let broken = false
  if (O <= 0) broken = true
  if (lhs <= rhs) broken = true

  if (broken) {
    // Revert to previous valid state
    if (oldVals) {
      lambda.value = oldVals[0]
      omega.value = oldVals[1]
      kappa.value = oldVals[2]
      alpha.value = oldVals[3]
      infoLabel.value = 'Constraint limit reached'
    }
    return
  }

  // Debounced update
  if (window.updateTimeout) clearTimeout(window.updateTimeout)
  window.updateTimeout = setTimeout(() => {
    forceUpdate()
  }, 200)
})

watch(currentView, (newVal) => {
  // Auto update view type
  if (viewer.value) {
    // Update viewer mode: Always Universe Mode (0)
    viewer.value.setModePublic(0)
    isSkyMode.value = false // Reset Sky Mode when changing projection view

    Environment.setView(newVal)
    Environment.update(Environment.UPDATE_VIEW)
  }
})

watch(showRefMarks, (val) => {
  if (viewer.value) viewer.value.setShowReferencesMarksPublic(val)
})

watch([ra1, dec1, beta], () => {
  // Update projection params
  Environment.setUserRa1(ra1.value)
  Environment.setUserDec1(dec1.value)
  Environment.setUserBeta(beta.value)
  // We might want to auto-update view if it's fast enough
  Environment.update(Environment.UPDATE_VIEW)
})

watch([comovingSpace, precision], () => {
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
