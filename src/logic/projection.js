/*
 * Copyright (C) 2008-2025 Mathieu Abati <mathieu.abati@gmail.com>
 * Copyright (C) 2008 Julie Fontaine
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

import Vect3d from '@/logic/vect3d.js'
import Vect4d from '@/logic/vect4d.js'
import * as trapezoidalIntegral from '@/logic/trapezoidalIntegral.js'
import * as rombergIntegral from '@/logic/rombergIntegral.js'
import { evolutionIntegrand } from '@/logic/evolutionIntegrand.js'
import { getProjectionWorkerPool } from '@/logic/workerPool.js'
import { useTargetsStore } from '@/stores/targets.js'

// Targets number threshold for using parallel computation
const PARALLEL_THRESHOLD = 500

/**
 * Calculate comoving distance.
 */
export function comovingDist(redshift, kappa, lambda, omega, alpha, precisionEnabled) {
  const zInv = 1.0 / (1.0 + redshift)
  const integrand = (x) => evolutionIntegrand(x, kappa, lambda, omega, alpha)

  if (precisionEnabled) {
    return trapezoidalIntegral.integrate(zInv, 1.0, 0.01, integrand)
  } else {
    return rombergIntegral.integrate(zInv, 1.0, 6, integrand)
  }
}

/**
 * Compute angular distance.
 */
export function computeAngularDist(redshift, kappa, lambda, omega, alpha, precisionEnabled) {
  let multiplier
  if (kappa === 0) multiplier = 1
  else if (kappa < 0.0) multiplier = Math.sqrt(-kappa)
  else multiplier = Math.sqrt(kappa)

  return multiplier * comovingDist(redshift, kappa, lambda, omega, alpha, precisionEnabled)
}

/**
 * Compute position.
 */
export function computePos(comovingSpaceFlag, angularDist, ascension, declination, redshift, kappa, lambda, omega, alpha, precisionEnabled) {
  const v = new Vect4d()

  if (!comovingSpaceFlag) {
    if (kappa < 0.0) {
      v.setX(Math.sinh(angularDist) * Math.cos(ascension) * Math.cos(declination))
      v.setY(Math.sinh(angularDist) * Math.sin(ascension) * Math.cos(declination))
      v.setZ(Math.sinh(angularDist) * Math.sin(declination))
      v.setT(Math.cosh(angularDist))
    } else if (kappa > 0.0) {
      v.setX(Math.sin(angularDist) * Math.cos(ascension) * Math.cos(declination))
      v.setY(Math.sin(angularDist) * Math.sin(ascension) * Math.cos(declination))
      v.setZ(Math.sin(angularDist) * Math.sin(declination))
      v.setT(Math.cos(angularDist))
    } else {
      // kappa = 0 (Flat) in Reference Space
      const cd = comovingDist(redshift, kappa, lambda, omega, alpha, precisionEnabled)
      v.setX(cd * Math.cos(ascension) * Math.cos(declination))
      v.setY(cd * Math.sin(ascension) * Math.cos(declination))
      v.setZ(cd * Math.sin(declination))
      v.setT(0)
    }
  } else {
    if (kappa < 0.0) {
      const s = 1 / Math.sqrt(-kappa)
      v.setX(s * Math.sinh(angularDist) * Math.cos(ascension) * Math.cos(declination))
      v.setY(s * Math.sinh(angularDist) * Math.sin(ascension) * Math.cos(declination))
      v.setZ(s * Math.sinh(angularDist) * Math.sin(declination))
      v.setT(s * Math.cosh(angularDist))
    } else if (kappa > 0.0) {
      const s = 1 / Math.sqrt(kappa)
      v.setX(s * Math.sin(angularDist) * Math.cos(ascension) * Math.cos(declination))
      v.setY(s * Math.sin(angularDist) * Math.sin(ascension) * Math.cos(declination))
      v.setZ(s * Math.sin(angularDist) * Math.sin(declination))
      v.setT(s * Math.cos(angularDist))
    } else {
      const cd = comovingDist(redshift, kappa, lambda, omega, alpha, precisionEnabled)
      v.setX(cd * Math.cos(ascension) * Math.cos(declination))
      v.setY(cd * Math.sin(ascension) * Math.cos(declination))
      v.setZ(cd * Math.sin(declination))
      v.setT(0)
    }
  }
  return v
}

/**
 * Compute projection
 */
export function computeProj(pos, view, E0, E1, E2, E3) {
  const p = new Vect4d(pos.x, pos.y, pos.z, pos.t)
  let x, y

  switch (view) {
    case 1:
      x = p.dotProd4d(E0)
      y = p.dotProd4d(E1)
      break
    case 2:
      x = p.dotProd4d(E0)
      y = p.dotProd4d(E2)
      break
    case 3:
      x = p.dotProd4d(E0)
      y = p.dotProd4d(E3)
      break
    case 4:
      x = p.dotProd4d(E1)
      y = p.dotProd4d(E2)
      break
    case 5:
      x = p.dotProd4d(E1)
      y = p.dotProd4d(E3)
      break
    case 6:
      x = p.dotProd4d(E2)
      y = p.dotProd4d(E3)
      break
    default:
      x = p.dotProd4d(E0)
      y = p.dotProd4d(E1)
      break
  }
  return { x, y }
}

/**
 * Compute angular distance for all targets.
 */
export function calcTargetsAngularDist(targets, kappa, lambda, omega, alpha, precisionEnabled) {
  if (!targets) return false

  for (let i = 0; i < targets.length; i++) {
    targets[i].setAngularDist(
      computeAngularDist(targets[i].getRedshift(), kappa, lambda, omega, alpha, precisionEnabled),
    )
  }
  return true
}

/**
 * Compute position for all targets.
 */
export function calcTargetsPos(targets, comovingSpaceFlag, kappa, lambda, omega, alpha, precisionEnabled) {
  if (!targets) return false

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]
    const v = computePos(
      comovingSpaceFlag,
      t.getAngularDist(),
      t.getAscension(),
      t.getDeclination(),
      t.getRedshift(),
      kappa,
      lambda,
      omega,
      alpha,
      precisionEnabled,
    )
    t.setPos(v)
  }
  return true
}

/**
 * Compute projection vectors.
 */
export function calcProjVects(RA1, Dec1, Beta, comovingSpaceFlag, kappa) {
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

/**
 * Compute projection for all targets.
 */
export function calcTargetsProj(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa) {
  if (!targets) return

  const projVects = calcProjVects(RA1, Dec1, Beta, comovingSpaceFlag, kappa)
  const E0 = projVects.E0
  const E1 = projVects.E1
  const E2 = projVects.E2
  const E3 = projVects.E3

  for (let i = 0; i < targets.length; i++) {
    const { x, y } = computeProj(targets[i].getPos(), view, E0, E1, E2, E3)
    targets[i].setx(x)
    targets[i].sety(y)
  }
}

// ============================================================================
// Parallel Computation Functions
// ============================================================================

/**
 * Helper to split targets into chunks for parallel processing.
 */
function splitIntoChunks(targets, numChunks) {
  const chunks = []
  const chunkSize = Math.ceil(targets.length / numChunks)

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, targets.length)
    if (start < targets.length) {
      chunks.push({
        indices: { start, end },
        targets: targets.slice(start, end),
      })
    }
  }

  return chunks
}

/**
 * Parallel version of calcTargetsAngularDist().
 */
export async function calcTargetsAngularDistParallel(targets, kappa, lambda, omega, alpha, precisionEnabled) {
  if (!targets || targets.length === 0) return false

  try {
    const pool = await getProjectionWorkerPool()
    const numWorkers = pool.getWorkerCount()
    const chunks = splitIntoChunks(targets, numWorkers)
    const targetsStore = useTargetsStore()
    const serializedTargets = targetsStore.serialize()

    // Create tasks for each chunk
    const tasks = chunks.map((chunk) => {
      // Slice the serialized array to match the chunk indices
      const chunkSerialized = serializedTargets.slice(chunk.indices.start, chunk.indices.end)
      return {
        type: 'calcAngularDist',
        data: {
          targets: chunkSerialized,
          kappa,
          lambda,
          omega,
          alpha,
          precisionEnabled,
        },
        indices: chunk.indices,
      }
    })

    // Execute in parallel
    const results = await pool.executeParallel(tasks)

    // Update targets with results
    results.forEach((result, chunkIndex) => {
      const { start } = tasks[chunkIndex].indices
      result.forEach((item, i) => {
        targets[start + i].setAngularDist(item.angularDistance)
      })
    })

    return true
  } catch (error) {
    console.error('Parallel calcTargetsAngularDist failed, falling back to single-threaded:', error)
    return calcTargetsAngularDist(targets, kappa, lambda, omega, alpha, precisionEnabled)
  }
}

/**
 * Parallel version of calcTargetsPos().
 */
export async function calcTargetsPosParallel(targets, comovingSpaceFlag, kappa, lambda, omega, alpha, precisionEnabled) {
  if (!targets || targets.length === 0) return false

  try {
    const pool = await getProjectionWorkerPool()
    const numWorkers = pool.getWorkerCount()
    const chunks = splitIntoChunks(targets, numWorkers)
    const targetsStore = useTargetsStore()
    const serializedTargets = targetsStore.serialize()

    // Create tasks for each chunk
    const tasks = chunks.map((chunk) => {
      const chunkSerialized = serializedTargets.slice(chunk.indices.start, chunk.indices.end)
      return {
        type: 'calcPos',
        data: {
          targets: chunkSerialized,
          comovingSpaceFlag,
          kappa,
          lambda,
          omega,
          alpha,
          precisionEnabled,
        },
        indices: chunk.indices,
      }
    })

    // Execute in parallel
    const results = await pool.executeParallel(tasks)

    // Update targets with results
    results.forEach((result, chunkIndex) => {
      const { start } = tasks[chunkIndex].indices
      result.forEach((item, i) => {
        const v = new Vect4d(item.pos.x, item.pos.y, item.pos.z, item.pos.t)
        targets[start + i].setPos(v)
      })
    })

    return true
  } catch (error) {
    console.error('Parallel calcTargetsPos failed, falling back to single-threaded:', error)
    return calcTargetsPos(targets, comovingSpaceFlag, kappa, lambda, omega, alpha, precisionEnabled)
  }
}

/**
 * Parallel version of calcTargetsProj().
 */
export async function calcTargetsProjParallel(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa) {
  if (!targets || targets.length === 0) return

  try {
    const pool = await getProjectionWorkerPool()
    const numWorkers = pool.getWorkerCount()
    const chunks = splitIntoChunks(targets, numWorkers)
    const targetsStore = useTargetsStore()
    const serializedTargets = targetsStore.serialize()

    // Create tasks for each chunk
    const tasks = chunks.map((chunk) => {
      const chunkSerialized = serializedTargets.slice(chunk.indices.start, chunk.indices.end)
      return {
        type: 'calcProj',
        data: {
          targets: chunkSerialized,
          view,
          RA1,
          Dec1,
          Beta,
          comovingSpaceFlag,
          kappa,
        },
        indices: chunk.indices,
      }
    })

    // Execute in parallel
    const results = await pool.executeParallel(tasks)

    // Update targets with results
    results.forEach((result, chunkIndex) => {
      const { start } = tasks[chunkIndex].indices
      result.forEach((item, i) => {
        targets[start + i].setx(item.x)
        targets[start + i].sety(item.y)
      })
    })
  } catch (error) {
    console.error('Parallel calcTargetsProj failed, falling back to single-threaded:', error)
    calcTargetsProj(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa)
  }
}

/**
 * Compute angular distance, position and projection for all targets, with parallelization if relevant.
 */
export async function updateAll(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa, lambda, omega, alpha, precisionEnabled) {
  // Use parallel computation for large datasets
  if (targets && targets.length >= PARALLEL_THRESHOLD) {
    try {
      await calcTargetsAngularDistParallel(targets, kappa, lambda, omega, alpha, precisionEnabled)
      await calcTargetsPosParallel(
        targets,
        comovingSpaceFlag,
        kappa,
        lambda,
        omega,
        alpha,
        precisionEnabled,
      )
      await calcTargetsProjParallel(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa)
      return
    } catch (error) {
      console.warn('Parallel computation failed, falling back to single-threaded:', error)
      // Fall through to single-threaded version
    }
  }

  // Single-threaded version for small datasets or fallback
  calcTargetsAngularDist(targets, kappa, lambda, omega, alpha, precisionEnabled)
  calcTargetsPos(targets, comovingSpaceFlag, kappa, lambda, omega, alpha, precisionEnabled)
  calcTargetsProj(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa)
}

/**
 * Compute projection for all targets, with parallelization if relevant.
 */
export async function updateView(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa) {
  // Use parallel computation for large datasets
  if (targets && targets.length >= PARALLEL_THRESHOLD) {
    try {
      await calcTargetsProjParallel(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa)
      return
    } catch (error) {
      console.warn('Parallel computation failed, falling back to single-threaded:', error)
      // Fall through to single-threaded version
    }
  }

  // Single-threaded version for small datasets or fallback
  calcTargetsProj(targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa)
}
