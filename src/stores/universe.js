import { defineStore } from 'pinia'
import { ref, computed, shallowRef, triggerRef } from 'vue'

import Vect3d from '@/logic/vect3d.js'
import Vect4d from '@/logic/vect4d.js'
import * as trapezoidalIntegral from '@/logic/trapezoidalIntegral.js'
import * as rombergIntegral from '@/logic/rombergIntegral.js'
import { polynomialP } from '@/logic/cosmologicalPolynomial.js'
import { evolutionIntegrand } from '@/logic/evolutionIntegrand.js'

function roundTo(n, digits) {
  const factor = Math.pow(10, digits)
  return Math.round(n * factor) / factor
}

export const UPDATE_ALL = 1
export const UPDATE_VIEW = 2
export const UPDATE_VIEWER = 3

export const useUniverseStore = defineStore('universe', () => {
  const selectedCount = ref(0)
  const selectionModeType = ref('additive') // 'additive', 'replace', 'intersection'

  const quasars = shallowRef(null)
  const ascension_max = ref(0)

  const lambda = ref(0)
  const omega = ref(0)
  const kappa = ref(0)
  const alpha = ref(0)

  const view = ref(1)
  const userRA1 = ref(0.0) // radians
  const userDec1 = ref(0.0) // radians
  const userBeta = ref(0.0) // radians
  const E0 = ref(new Vect4d())
  const E1 = ref(new Vect4d())
  const E2 = ref(new Vect4d())
  const E3 = ref(new Vect4d())

  const viewerCanvas = ref(null)
  const precisionEnabled = ref(false)
  const comovingSpaceFlag = ref(false)
  const somethingToShow = ref(false)
  const mainWin = ref(null)
  const pointSize = ref(2.0)

  // Getters (as computed properties)
  const userDec1Deg = computed(() => (180 * userDec1.value) / Math.PI)
  const userBetaHours = computed(() => (12 * userBeta.value) / Math.PI)

  // Actions
  function setPointSize(size) {
    pointSize.value = size
  }

  function setSelectedCount(n) {
    selectedCount.value = n
  }

  function setSelectionModeType(type) {
    if (['additive', 'replace', 'intersection'].includes(type)) {
      selectionModeType.value = type
    } else {
      console.warn(`Invalid selection mode type: ${type}`)
    }
  }

  function initEnvironment() {
    quasars.value = null
    ascension_max.value = 0
    try {
      setCosmoConsts(1.2, 0.2, 0.40005, 0.00005)
    } catch (ex) {
      console.error('Cosmological constants are incorrect!')
      console.error(ex && ex.message ? ex.message : ex)
      throw ex
    }
    precisionEnabled.value = false
    view.value = 1
    userRA1.value = 0.0
    userDec1.value = 0.0
    userBeta.value = 0.0
    comovingSpaceFlag.value = false
    somethingToShow.value = false
  }

  function setQuasars(qArray) {
    quasars.value = qArray
  }

  function setAscensionMax(v) {
    ascension_max.value = v
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

  function setProjVects() {
    const P1 = new Vect3d()
    P1.setX(Math.cos(userRA1.value) * Math.cos(userDec1.value))
    P1.setY(Math.sin(userRA1.value) * Math.cos(userDec1.value))
    P1.setZ(Math.sin(userDec1.value))

    let eta1 = new Vect3d()
    let eta2 = new Vect3d()

    if (Math.abs(P1.getX() - 1) > 1e-5) {
      const i = new Vect3d()
      i.setX(1)
      i.setY(0)
      i.setZ(0)
      const temp = P1.vectProd3d(i)
      const norme = temp.norm()
      eta1.setX(temp.getX() / norme)
      eta1.setY(temp.getY() / norme)
      eta1.setZ(temp.getZ() / norme)
    } else {
      const j = new Vect3d()
      j.setX(0)
      j.setY(1)
      j.setZ(0)
      const temp = P1.vectProd3d(j)
      const norme = temp.norm()
      eta1.setX(temp.getX() / norme)
      eta1.setY(temp.getY() / norme)
      eta1.setZ(temp.getZ() / norme)
    }

    eta2 = P1.vectProd3d(eta1)

    const P2 = new Vect3d()
    P2.setX(Math.cos(userBeta.value) * eta1.getX() + Math.sin(userBeta.value) * eta2.getX())
    P2.setY(Math.cos(userBeta.value) * eta1.getY() + Math.sin(userBeta.value) * eta2.getY())
    P2.setZ(Math.cos(userBeta.value) * eta1.getZ() + Math.sin(userBeta.value) * eta2.getZ())

    const P3 = P1.vectProd3d(P2)

    E0.value.setX(0.0)
    E0.value.setY(0.0)
    E0.value.setZ(0.0)
    E0.value.setT(1.0)
    E1.value.setX(P1.getX())
    E1.value.setY(P1.getY())
    E1.value.setZ(P1.getZ())
    E1.value.setT(0.0)
    E2.value.setX(P2.getX())
    E2.value.setY(P2.getY())
    E2.value.setZ(P2.getZ())
    E2.value.setT(0.0)
    E3.value.setX(P3.getX())
    E3.value.setY(P3.getY())
    E3.value.setZ(P3.getZ())
    E3.value.setT(0.0)
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

  function setMainWindow(windowRef) {
    mainWin.value = windowRef
  }

  function comovingDist(i) {
    const zInv = 1.0 / (1.0 + quasars.value[i].getRedshift())
    if (precisionEnabled.value) {
      return trapezoidalIntegral.integrate(zInv, 1.0, 0.01, evolutionIntegrand)
    } else {
      return rombergIntegral.integrate(zInv, 1.0, 6, evolutionIntegrand)
    }
  }

  function calcQuasarsAngularDist() {
    if (kappa.value === 0) return false
    if (!quasars.value) return false

    let sqrt_kappa
    if (kappa.value < 0.0) sqrt_kappa = Math.sqrt(-kappa.value)
    else sqrt_kappa = Math.sqrt(kappa.value)

    for (let i = 0; i < quasars.value.length; i++) {
      quasars.value[i].setAngularDist(sqrt_kappa * comovingDist(i))
    }
    triggerRef(quasars)
    return true
  }

  function calcQuasarsPos() {
    if (!quasars.value) return false

    if (!comovingSpaceFlag.value) {
      if (kappa.value < 0.0) {
        for (let i = 0; i < quasars.value.length; i++) {
          const q = quasars.value[i]
          const v = new Vect4d()
          v.setX(
            Math.sinh(q.getAngularDist()) *
              Math.cos(q.getAscension()) *
              Math.cos(q.getDeclination()),
          )
          v.setY(
            Math.sinh(q.getAngularDist()) *
              Math.sin(q.getAscension()) *
              Math.cos(q.getDeclination()),
          )
          v.setZ(Math.sinh(q.getAngularDist()) * Math.sin(q.getDeclination()))
          v.setT(Math.cosh(q.getAngularDist()))
          q.setPos(v)
        }
      } else if (kappa.value > 0.0) {
        for (let i = 0; i < quasars.value.length; i++) {
          const q = quasars.value[i]
          const v = new Vect4d()
          v.setX(
            Math.sin(q.getAngularDist()) *
              Math.cos(q.getAscension()) *
              Math.cos(q.getDeclination()),
          )
          v.setY(
            Math.sin(q.getAngularDist()) *
              Math.sin(q.getAscension()) *
              Math.cos(q.getDeclination()),
          )
          v.setZ(Math.sin(q.getAngularDist()) * Math.sin(q.getDeclination()))
          v.setT(Math.cos(q.getAngularDist()))
          q.setPos(v)
        }
      }
    } else {
      if (kappa.value < 0.0) {
        const s = 1 / Math.sqrt(-kappa.value)
        for (let i = 0; i < quasars.value.length; i++) {
          const q = quasars.value[i]
          const v = new Vect4d()
          v.setX(
            s *
              Math.sinh(q.getAngularDist()) *
              Math.cos(q.getAscension()) *
              Math.cos(q.getDeclination()),
          )
          v.setY(
            s *
              Math.sinh(q.getAngularDist()) *
              Math.sin(q.getAscension()) *
              Math.cos(q.getDeclination()),
          )
          v.setZ(s * Math.sinh(q.getAngularDist()) * Math.sin(q.getDeclination()))
          v.setT(s * Math.cosh(q.getAngularDist()))
          q.setPos(v)
        }
      } else if (kappa.value > 0.0) {
        const s = 1 / Math.sqrt(kappa.value)
        for (let i = 0; i < quasars.value.length; i++) {
          const q = quasars.value[i]
          const v = new Vect4d()
          v.setX(
            s *
              Math.sin(q.getAngularDist()) *
              Math.cos(q.getAscension()) *
              Math.cos(q.getDeclination()),
          )
          v.setY(
            s *
              Math.sin(q.getAngularDist()) *
              Math.sin(q.getAscension()) *
              Math.cos(q.getDeclination()),
          )
          v.setZ(s * Math.sin(q.getAngularDist()) * Math.sin(q.getDeclination()))
          v.setT(s * Math.cos(q.getAngularDist()))
          q.setPos(v)
        }
      } else {
        for (let i = 0; i < quasars.value.length; i++) {
          const q = quasars.value[i]
          const cd = comovingDist(i)
          const v = new Vect4d()
          v.setX(cd * Math.cos(q.getAscension()) * Math.cos(q.getDeclination()))
          v.setY(cd * Math.sin(q.getAscension()) * Math.cos(q.getDeclination()))
          v.setZ(cd * Math.sin(q.getDeclination()))
          v.setT(0)
          q.setPos(v)
        }
      }
    }
    triggerRef(quasars)
    return true
  }

  function calcQuasarsProj() {
    setProjVects()
    if (!quasars.value) return

    switch (view.value) {
      case 1:
        for (let i = 0; i < quasars.value.length; i++) {
          quasars.value[i].setx(quasars.value[i].getPos().dotProd4d(E0.value))
          quasars.value[i].sety(quasars.value[i].getPos().dotProd4d(E1.value))
        }
        break
      case 2:
        for (let i = 0; i < quasars.value.length; i++) {
          quasars.value[i].setx(quasars.value[i].getPos().dotProd4d(E0.value))
          quasars.value[i].sety(quasars.value[i].getPos().dotProd4d(E2.value))
        }
        break
      case 3:
        for (let i = 0; i < quasars.value.length; i++) {
          quasars.value[i].setx(quasars.value[i].getPos().dotProd4d(E0.value))
          quasars.value[i].sety(quasars.value[i].getPos().dotProd4d(E3.value))
        }
        break
      case 4:
        for (let i = 0; i < quasars.value.length; i++) {
          quasars.value[i].setx(quasars.value[i].getPos().dotProd4d(E1.value))
          quasars.value[i].sety(quasars.value[i].getPos().dotProd4d(E2.value))
        }
        break
      case 5:
        for (let i = 0; i < quasars.value.length; i++) {
          quasars.value[i].setx(quasars.value[i].getPos().dotProd4d(E1.value))
          quasars.value[i].sety(quasars.value[i].getPos().dotProd4d(E3.value))
        }
        break
      case 6:
        for (let i = 0; i < quasars.value.length; i++) {
          quasars.value[i].setx(quasars.value[i].getPos().dotProd4d(E2.value))
          quasars.value[i].sety(quasars.value[i].getPos().dotProd4d(E3.value))
        }
        break
      default:
        for (let i = 0; i < quasars.value.length; i++) {
          quasars.value[i].setx(quasars.value[i].getPos().dotProd4d(E0.value))
          quasars.value[i].sety(quasars.value[i].getPos().dotProd4d(E1.value))
        }
        break
    }
    triggerRef(quasars)
    somethingToShow.value = true
  }

  function update(flag) {
    if (flag !== UPDATE_ALL && flag !== UPDATE_VIEW && flag !== UPDATE_VIEWER) {
      throw new Error('Update accepted values are: UPDATE_ALL, UPDATE_VIEW, UPDATE_VIEWER')
    }

    if (flag === UPDATE_ALL) {
      calcQuasarsAngularDist()
      calcQuasarsPos()
      calcQuasarsProj()
      if (
        viewerCanvas.value &&
        typeof viewerCanvas.value.updateCanvas === 'function'
      ) {
        viewerCanvas.value.updateCanvas()
      }
    } else if (flag === UPDATE_VIEW) {
      calcQuasarsProj()
      if (
        viewerCanvas.value &&
        typeof viewerCanvas.value.updateCanvas === 'function'
      ) {
        viewerCanvas.value.updateCanvas()
      }
    } else if (flag === UPDATE_VIEWER) {
      if (
        viewerCanvas.value &&
        typeof viewerCanvas.value.updateCanvas === 'function'
      ) {
        viewerCanvas.value.updateCanvas()
      }
    }
  }

  function resetSelection() {
    selectedCount.value = 0
    if (quasars.value) {
      quasars.value.forEach(q => q.setSelected(false))
    }
    update(UPDATE_VIEWER);
  }

  return {
    selectedCount,
    selectionModeType,
    quasars,
    ascension_max,
    lambda,
    omega,
    kappa,
    alpha,
    view,
    userRA1,
    userDec1,
    userBeta,
    E0,
    E1,
    E2,
    E3,
    viewerCanvas,
    precisionEnabled,
    comovingSpaceFlag,
    somethingToShow,
    mainWin,
    pointSize,
    userDec1Deg,
    userBetaHours,
    setSelectedCount,
    setSelectionModeType,
    setPointSize,
    initEnvironment,
    setQuasars,
    setAscensionMax,
    setCosmoConsts,
    setUserRa1,
    setUserDec1,
    setUserBeta,
    setProjVects,
    setView,
    setViewerCanvas,
    enablePrecision,
    setComovingSpace,
    setMainWindow,
    calcQuasarsAngularDist,
    calcQuasarsPos,
    calcQuasarsProj,
    update,
    resetSelection,
  }
})
