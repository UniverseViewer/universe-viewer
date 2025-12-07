/**
 * Projection computations
 */

import Vect3d from '@/logic/vect3d.js'
import Vect4d from '@/logic/vect4d.js'
import * as trapezoidalIntegral from '@/logic/trapezoidalIntegral.js'
import * as rombergIntegral from '@/logic/rombergIntegral.js'
import { evolutionIntegrand } from '@/logic/evolutionIntegrand.js'

export function comovingDist(redshift, precisionEnabled = false) {
  const zInv = 1.0 / (1.0 + redshift)
  if (precisionEnabled) {
    return trapezoidalIntegral.integrate(zInv, 1.0, 0.01, evolutionIntegrand)
  } else {
    return rombergIntegral.integrate(zInv, 1.0, 6, evolutionIntegrand)
  }
}

export function calcQuasarsAngularDist(quasars, kappa, precisionEnabled) {
  if (!quasars) return false

  let multiplier
  if (kappa === 0) multiplier = 1
  else if (kappa < 0.0) multiplier = Math.sqrt(-kappa)
  else multiplier = Math.sqrt(kappa)

  for (let i = 0; i < quasars.length; i++) {
    quasars[i].setAngularDist(multiplier * comovingDist(quasars[i].getRedshift()), precisionEnabled)
  }
  return true
}

export function calcQuasarsPos(quasars, kappa, precisionEnabled, comovingSpaceFlag) {
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
    } else {
      // kappa = 0 (Flat) in Reference Space
      // Behaves same as Flat Comoving Space
      for (let i = 0; i < quasars.length; i++) {
        const q = quasars[i]
        const cd = comovingDist(quasars[i].getRedshift(), precisionEnabled)
        const v = new Vect4d()
        v.setX(cd * Math.cos(q.getAscension()) * Math.cos(q.getDeclination()))
        v.setY(cd * Math.sin(q.getAscension()) * Math.cos(q.getDeclination()))
        v.setZ(cd * Math.sin(q.getDeclination()))
        v.setT(0)
        q.setPos(v)
      }
    }
  } else {
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
      for (let i = 0; i < quasars.length; i++) {
        const q = quasars[i]
        const cd = comovingDist(quasars[i].getRedshift(), precisionEnabled)
        const v = new Vect4d()
        v.setX(cd * Math.cos(q.getAscension()) * Math.cos(q.getDeclination()))
        v.setY(cd * Math.sin(q.getAscension()) * Math.cos(q.getDeclination()))
        v.setZ(cd * Math.sin(q.getDeclination()))
        v.setT(0)
        q.setPos(v)
      }
    }
  }
  return true
}

function calcProjVects(RA1, Dec1, Beta, kappa, comovingSpaceFlag) {
  const E0 = new Vect4d()
  const E1 = new Vect4d()
  const E2 = new Vect4d()
  const E3 = new Vect4d()

  const P1 = new Vect3d()
  P1.setX(Math.cos(RA1) * Math.cos(Dec1))
  P1.setY(Math.sin(RA1) * Math.cos(Dec1))
  P1.setZ(Math.sin(Dec1))

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
  P2.setX(Math.cos(Beta) * eta1.getX() + Math.sin(Beta) * eta2.getX())
  P2.setY(Math.cos(Beta) * eta1.getY() + Math.sin(Beta) * eta2.getY())
  P2.setZ(Math.cos(Beta) * eta1.getZ() + Math.sin(Beta) * eta2.getZ())

  const P3 = P1.vectProd3d(P2)

  E0.setX(0.0)
  E0.setY(0.0)
  E0.setZ(0.0)
  if (comovingSpaceFlag && kappa !== 0) {
    E0.setT(Math.sqrt(Math.abs(kappa)))
  } else {
    E0.setT(1.0)
  }
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

  return { E0, E1, E2, E3 }
}

export function calcQuasarsProj(quasars, view, RA1, Dec1, Beta, kappa, comovingSpaceFlag) {
  if (!quasars) return

  const projVects = calcProjVects(RA1, Dec1, Beta, kappa, comovingSpaceFlag)
  const E0 = projVects.E0
  const E1 = projVects.E1
  const E2 = projVects.E2
  const E3 = projVects.E3

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
}

export function updateAll(
  quasars,
  view,
  RA1,
  Dec1,
  Beta,
  kappa,
  precisionEnabled,
  comovingSpaceFlag,
) {
  calcQuasarsAngularDist(quasars, kappa, precisionEnabled)
  calcQuasarsPos(quasars, kappa, precisionEnabled, comovingSpaceFlag)
  calcQuasarsProj(quasars, view, RA1, Dec1, Beta, kappa, comovingSpaceFlag)
}
export function updateView(quasars, view, RA1, Dec1, Beta, kappa, comovingSpaceFlag) {
  calcQuasarsProj(quasars, view, RA1, Dec1, Beta, kappa, comovingSpaceFlag)
}
