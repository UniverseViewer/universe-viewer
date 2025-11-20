// src/logic/environment.js
//
// Port of Environment.java -> JavaScript (ES module, plain JS)
// Assumptions:
//  - Quasar class is exported from '@/logic/quasar.js'
//  - Vect3d and Vect4d are exported from '@/logic/vect3d.js' and '@/logic/vect4d.js'
//  - Integral and Integral2 expose integrate(...) as in the Java code
//  - ViewerCanvas will be a Vue component instance (or an adapter object) with updateCanvas()

// import Quasar from '@/logic/quasar.js'; // Unused
import Vect3d from '@/logic/vect3d.js'
import Vect4d from '@/logic/vect4d.js'
import * as Integral from '@/logic/integral.js' // expects .integrate(...)
import * as Integral2 from '@/logic/integral2.js' // expects .integrate(...)

// ---------- Module state (was static fields in Java) ----------
let quasars = null // array of Quasar
let ascension_max = 0

let lambda = 0
let omega = 0
let kappa = 0
let alpha = 0

let view = 1
let userRA1 = 0.0 // radians (internal)
let userDec1 = 0.0 // radians (internal)
let userBeta = 0.0 // radians (internal)
const E0 = new Vect4d()
const E1 = new Vect4d()
const E2 = new Vect4d()
const E3 = new Vect4d()

let openGLViewerCanvas = null // in web: a Vue component instance or adapter
let precisionEnabled = false
let comovingSpaceFlag = false
let somethingToShow = false
let mainWin = null

// ---------- constants (exported) ----------
export const UPDATE_ALL = 1
export const UPDATE_VIEW = 2
export const UPDATE_VIEWER = 3

// ---------- helpers ----------
function roundTo(n, digits) {
  // similar to Java UniverseViewer.floor(..., 5) behaviour expected in original code:
  // we'll treat as rounding to `digits` decimals
  const factor = Math.pow(10, digits)
  return Math.round(n * factor) / factor
}

// ---------- public API functions ----------

export function initEnvironment() {
  quasars = null
  ascension_max = 0

  // default cosmological constants (same as original code)
  // setCosmoConsts may throw if constraints not met
  try {
    setCosmoConsts(1.2, 0.2, 0.40005, 0.00005)
  } catch (ex) {
    console.error('Cosmological constants are incorrect!')
    console.error(ex && ex.message ? ex.message : ex)
    throw ex
  }

  // viewer canvas will be created by Vue; leave null for now
  // openGLViewerCanvas = null

  precisionEnabled = false

  view = 1
  userRA1 = 0.0
  userDec1 = 0.0
  userBeta = 0.0

  comovingSpaceFlag = false
  somethingToShow = false
}

export function getQuasars() {
  return quasars
}
export function setQuasars(qArray) {
  // expect an Array of Quasar instances (or plain objects compatible)
  quasars = qArray
}

export function getAscensionMax() {
  return ascension_max
}
export function setAscensionMax(v) {
  ascension_max = v
}

// -- cosmological constants --
export function setCosmoConsts(newlambda, newomega, newkappa, newalpha) {
  // Constraint: lambda - kappa + omega + alpha = 1 (rounded to 5 decimals in Java)
  if (roundTo(newlambda - newkappa + newomega + newalpha, 5) !== 1.0) {
    throw new Error('Constraint broken:\nlambda - kappa + omega + alpha = 1.0 not verified!')
  }
  if (newomega < 0) {
    throw new Error('Constraint broken:\nomega > 0 not verified!')
  }
  if (!((27.0 / 4.0) * newlambda * newomega * newomega > newkappa * newkappa * newkappa)) {
    throw new Error('Constraint broken:\n(27/4) * lambda * omega² > kappa^3 not verified!')
  }
  if (!comovingSpaceFlag && newkappa === 0) {
    throw new Error('kappa cannot be equal to zero if comovingSpace is not enabled!')
  }

  lambda = newlambda
  omega = newomega
  kappa = newkappa
  alpha = newalpha
  console.log('Environment: setCosmoConsts updated:', lambda, omega, kappa, alpha)
}

export function getLambda() {
  return lambda
}
export function getOmega() {
  return omega
}
export function getKappa() {
  return kappa
}
export function getAlpha() {
  return alpha
}

// -- user parameters (RA/Dec/Beta) --
/// Note: setUserRa1 expects RA in hours (0..24) as in original code
export function getUserRa1Rad() {
  return userRA1
}
export function getUserDec1Rad() {
  return userDec1
}
export function getUserBetaRad() {
  return userBeta
}
export function getUserDec1Deg() {
  return (180 * userDec1) / Math.PI
}
export function getUserBetaHours() {
  return (12 * userBeta) / Math.PI
}

export function setUserRa1(RA1_hours) {
  userRA1 = (Math.PI / 12.0) * RA1_hours // hours -> radians
}
export function setUserDec1(Dec1_deg) {
  userDec1 = (Math.PI / 180.0) * Dec1_deg // deg -> rad
}
export function setUserBeta(Beta_hours) {
  userBeta = (Math.PI / 12.0) * Beta_hours // hours -> rad
}

// Compute projection basis vectors (E0..E3)
export function setProjVects() {
  const P1 = new Vect3d()

  P1.setX(Math.cos(getUserRa1Rad()) * Math.cos(getUserDec1Rad()))
  P1.setY(Math.sin(getUserRa1Rad()) * Math.cos(getUserDec1Rad()))
  P1.setZ(Math.sin(getUserDec1Rad()))

  let eta1 = new Vect3d()
  let eta2 = new Vect3d()

  // epsilon ~ one arcsecond
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
  P2.setX(Math.cos(getUserBetaRad()) * eta1.getX() + Math.sin(getUserBetaRad()) * eta2.getX())
  P2.setY(Math.cos(getUserBetaRad()) * eta1.getY() + Math.sin(getUserBetaRad()) * eta2.getY())
  P2.setZ(Math.cos(getUserBetaRad()) * eta1.getZ() + Math.sin(getUserBetaRad()) * eta2.getZ())

  const P3 = P1.vectProd3d(P2)

  E0.setX(0.0)
  E0.setY(0.0)
  E0.setZ(0.0)
  E0.setT(1.0)

  E1.setX(P1.getX())
  E1.setY(P1.getY())
  E1.setZ(P1.getZ())
  E1.setT(0.0)
  E2.setX(P2.getX())
  E2.setY(P2.getY())
  E2.setZ(P2.getZ())
  E2.setT(0.0)
  E3.setX(P3.getX())
  E3.setY(P3.getY())
  E3.setZ(P3.getZ())
  E3.setT(0.0)
}

export function getProjVectE0() {
  return E0
}
export function getProjVectE1() {
  return E1
}
export function getProjVectE2() {
  return E2
}
export function getProjVectE3() {
  return E3
}

export function getView() {
  return view
}
export function setView(v) {
  if (v < 1 || v > 6) throw new Error('View number incorrect, must be {1,2,3,4,5,6}')
  view = v
}

// --- misc accessors ---
export function getopenGLViewerCanvas() {
  return openGLViewerCanvas
}
// In web: call setOpenGLViewerCanvas with the component instance or adapter
export function setOpenGLViewerCanvas(c) {
  openGLViewerCanvas = c
}

export function enablePrecision(prec) {
  precisionEnabled = !!prec
}
// Renamed function to avoid collision with module name
export function setComovingSpace(flag) {
  if (!flag) {
    if (kappa === 0) throw new Error('Cant disable comoving space option: Kappa = 0!')
  }
  comovingSpaceFlag = !!flag
}
export function isSomethingToShow() {
  return somethingToShow
}

export function setMainWindow(windowRef) {
  mainWin = windowRef
}
export function getMainWindow() {
  return mainWin
}

// ---------- calculations ----------
function comovingDist(i) {
  // parallels Java: choose Integral or Integral2 depending on precision
  const zInv = 1.0 / (1.0 + quasars[i].getRedshift())
  if (precisionEnabled) {
    return Integral.integrate(zInv, 1.0, 0.01)
  } else {
    return Integral2.integrate(zInv, 1.0, 6)
  }
}

export function calcQuasarsAngularDist() {
  // returns true on success else false (like Java)
  console.log(
    'Environment: calcQuasarsAngularDist, kappa=',
    kappa,
    'quasars len=',
    quasars ? quasars.length : 0,
  )
  if (kappa === 0) return false
  if (!quasars) return false

  let sqrt_kappa
  if (kappa < 0.0) sqrt_kappa = Math.sqrt(-kappa)
  else sqrt_kappa = Math.sqrt(kappa)

  for (let i = 0; i < quasars.length; i++) {
    quasars[i].setAngularDist(sqrt_kappa * comovingDist(i))
  }
  return true
}

export function calcQuasarsPos() {
  if (!quasars) return false

  if (!comovingSpaceFlag) {
    if (kappa < 0.0) {
      for (let i = 0; i < quasars.length; i++) {
        const q = quasars[i]
        const v = new Vect4d()
        v.setX(
          Math.sinh(q.getAngularDist()) * Math.cos(q.getAscension()) * Math.cos(q.getDeclination()),
        )
        v.setY(
          Math.sinh(q.getAngularDist()) * Math.sin(q.getAscension()) * Math.cos(q.getDeclination()),
        )
        v.setZ(Math.sinh(q.getAngularDist()) * Math.sin(q.getDeclination()))
        v.setT(Math.cosh(q.getAngularDist()))
        q.setPos(v)
      }
    } else if (kappa > 0.0) {
      for (let i = 0; i < quasars.length; i++) {
        const q = quasars[i]
        const v = new Vect4d()
        v.setX(
          Math.sin(q.getAngularDist()) * Math.cos(q.getAscension()) * Math.cos(q.getDeclination()),
        )
        v.setY(
          Math.sin(q.getAngularDist()) * Math.sin(q.getAscension()) * Math.cos(q.getDeclination()),
        )
        v.setZ(Math.sin(q.getAngularDist()) * Math.sin(q.getDeclination()))
        v.setT(Math.cos(q.getAngularDist()))
        q.setPos(v)
      }
    }
    return true
  } else {
    // comovingSpaceFlag == true
    if (kappa < 0.0) {
      const s = 1 / Math.sqrt(-kappa)
      for (let i = 0; i < quasars.length; i++) {
        const q = quasars[i]
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
    } else if (kappa > 0.0) {
      const s = 1 / Math.sqrt(kappa)
      for (let i = 0; i < quasars.length; i++) {
        const q = quasars[i]
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
      // kappa == 0
      for (let i = 0; i < quasars.length; i++) {
        const q = quasars[i]
        const cd = comovingDist(i)
        const v = new Vect4d()
        v.setX(cd * Math.cos(q.getAscension()) * Math.cos(q.getDeclination()))
        v.setY(cd * Math.sin(q.getAscension()) * Math.cos(q.getDeclination()))
        v.setZ(cd * Math.sin(q.getDeclination()))
        v.setT(0)
        q.setPos(v)
      }
    }
    return true
  }
}

export function calcQuasarsProj() {
  setProjVects()
  if (!quasars) return

  console.log('Environment: calcQuasarsProj view=', view)

  switch (view) {
    case 1:
      for (let i = 0; i < quasars.length; i++) {
        quasars[i].setx(quasars[i].getPos().dotProd4d(E0))
        quasars[i].sety(quasars[i].getPos().dotProd4d(E1))
      }
      break
    case 2:
      for (let i = 0; i < quasars.length; i++) {
        quasars[i].setx(quasars[i].getPos().dotProd4d(E0))
        quasars[i].sety(quasars[i].getPos().dotProd4d(E2))
      }
      break
    case 3:
      for (let i = 0; i < quasars.length; i++) {
        quasars[i].setx(quasars[i].getPos().dotProd4d(E0))
        quasars[i].sety(quasars[i].getPos().dotProd4d(E3))
      }
      break
    case 4:
      for (let i = 0; i < quasars.length; i++) {
        quasars[i].setx(quasars[i].getPos().dotProd4d(E1))
        quasars[i].sety(quasars[i].getPos().dotProd4d(E2))
      }
      break
    case 5:
      for (let i = 0; i < quasars.length; i++) {
        quasars[i].setx(quasars[i].getPos().dotProd4d(E1))
        quasars[i].sety(quasars[i].getPos().dotProd4d(E3))
      }
      break
    case 6:
      for (let i = 0; i < quasars.length; i++) {
        quasars[i].setx(quasars[i].getPos().dotProd4d(E2))
        quasars[i].sety(quasars[i].getPos().dotProd4d(E3))
      }
      break
    default:
      for (let i = 0; i < quasars.length; i++) {
        quasars[i].setx(quasars[i].getPos().dotProd4d(E0))
        quasars[i].sety(quasars[i].getPos().dotProd4d(E1))
      }
      break
  }

  somethingToShow = true
}

// update(flag) behaviour
export function update(flag) {
  if (flag !== UPDATE_ALL && flag !== UPDATE_VIEW && flag !== UPDATE_VIEWER) {
    throw new Error('Update accepted values are: UPDATE_ALL, UPDATE_VIEW, UPDATE_VIEWER')
  }

  if (flag === UPDATE_ALL) {
    calcQuasarsAngularDist()
    calcQuasarsPos()
    calcQuasarsProj()
    if (openGLViewerCanvas && typeof openGLViewerCanvas.updateCanvas === 'function') {
      openGLViewerCanvas.updateCanvas()
    }
  } else if (flag === UPDATE_VIEW) {
    calcQuasarsProj()
    if (openGLViewerCanvas && typeof openGLViewerCanvas.updateCanvas === 'function') {
      openGLViewerCanvas.updateCanvas()
    }
  } else if (flag === UPDATE_VIEWER) {
    if (openGLViewerCanvas && typeof openGLViewerCanvas.updateCanvas === 'function') {
      openGLViewerCanvas.updateCanvas()
    }
  }
}
