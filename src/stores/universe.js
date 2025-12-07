import { defineStore } from 'pinia'
import pkg from '../../package.json'
import { ref, computed } from 'vue'

import * as trapezoidalIntegral from '@/logic/trapezoidalIntegral.js'
import * as rombergIntegral from '@/logic/rombergIntegral.js'
import { evolutionIntegrand } from '@/logic/evolutionIntegrand.js'

function roundTo(n, digits) {
  const factor = Math.pow(10, digits)
  return Math.round(n * factor) / factor
}

export const useUniverseStore = defineStore('universe', () => {
  const version = ref(pkg.version)

  const lambda = ref(0)
  const omega = ref(0)
  const kappa = ref(0)
  const alpha = ref(0)

  const view = ref(4)
  const userRA1 = ref(0.0) // radians
  const userDec1 = ref(0.0) // radians
  const userBeta = ref(0.0) // radians

  const viewerCanvas = ref(null)
  const precisionEnabled = ref(false)
  const comovingSpaceFlag = ref(true)
  const pointSize = ref(1.5)

  const userDec1Deg = computed(() => (180 * userDec1.value) / Math.PI)
  const userBetaHours = computed(() => (12 * userBeta.value) / Math.PI)

  function initialize() {
    try {
      setCosmoConsts(1.2, 0.2, 0.40005, 0.00005)
    } catch (ex) {
      console.error('Cosmological parameters are incorrect!')
      console.error(ex && ex.message ? ex.message : ex)
      throw ex
    }
  }

  const horizon = computed(() => {
    /* The horizon is the distance to z=infinity, i.e., a=0. So we integrate from 0.0 to 1.0. */
    if (precisionEnabled.value) {
      return trapezoidalIntegral.integrate(0.0, 1.0, 0.001, evolutionIntegrand)
    } else {
      return rombergIntegral.integrate(0.0, 1.0, 10, evolutionIntegrand)
    }
  })
  const horizonAngularDistance = computed(() => {
    if (kappa.value > 0) {
      return Math.sqrt(kappa.value) * horizon.value
    } else if (kappa.value < 0) {
      return Math.sqrt(-kappa.value) * horizon.value
    } else {
      // kappa = 0
      return horizon.value
    }
  })

  function setPointSize(size) {
    pointSize.value = size
  }

  function setCosmoConsts(newlambda, newomega, newkappa, newalpha) {
    if (roundTo(newlambda - newkappa + newomega + newalpha, 5) !== 1.0) {
      throw new Error('Constraint broken:\nlambda - kappa + omega + alpha = 1.0 not verified!')
    }
    if (newomega < 0) {
      throw new Error('Constraint broken:\nomega > 0 not verified!')
    }
    if (!((27.0 / 4.0) * newlambda * newomega * newomega > newkappa * newkappa * newkappa)) {
      throw new Error('Constraint broken:\n(27/4) * lambda * omega² > kappa^3 not verified!')
    }
    if (!comovingSpaceFlag.value && newkappa === 0) {
      throw new Error('kappa cannot be equal to zero if comovingSpace is not enabled!')
    }
    lambda.value = newlambda
    omega.value = newomega
    kappa.value = newkappa
    alpha.value = newalpha
  }

  function setUserRa1(RA1_hours) {
    userRA1.value = (Math.PI / 12.0) * RA1_hours
  }

  function setUserDec1(Dec1_deg) {
    userDec1.value = (Math.PI / 180.0) * Dec1_deg
  }

  function setUserBeta(Beta_hours) {
    userBeta.value = (Math.PI / 12.0) * Beta_hours
  }

  function setView(v) {
    if (v < 1 || v > 6) throw new Error('View number incorrect, must be {1,2,3,4,5,6}')
    view.value = v
  }

  function setViewerCanvas(c) {
    viewerCanvas.value = c
  }

  function enablePrecision(prec) {
    precisionEnabled.value = !!prec
  }

  function setComovingSpace(flag) {
    if (!flag) {
      if (kappa.value === 0) throw new Error('Cant disable comoving space option: Kappa = 0!')
    }
    comovingSpaceFlag.value = !!flag
  }

  return {
    initialize,
    version,
    lambda,
    omega,
    kappa,
    alpha,
    view,
    userRA1,
    userDec1,
    userBeta,
    userDec1Deg,
    userBetaHours,
    viewerCanvas,
    precisionEnabled,
    comovingSpaceFlag,
    horizon,
    horizonAngularDistance,
    pointSize,
    // Setters
    setPointSize,
    setCosmoConsts,
    setUserRa1,
    setUserDec1,
    setUserBeta,
    setView,
    setViewerCanvas,
    enablePrecision,
    setComovingSpace,
  }
})
