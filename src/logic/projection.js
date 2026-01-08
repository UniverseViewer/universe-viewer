/*
 * Copyright (C) 2008-2026 Mathieu Abati <mathieu.abati@gmail.com>
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
import { useStatusStore } from '@/stores/status.js'
import { useCatalogStore } from '@/stores/catalog.js'

// Targets number threshold for using parallel computation
const PARALLEL_THRESHOLD = 300000

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
export function computePos(
  comovingSpaceFlag,
  angularDist,
  ascension,
  declination,
  redshift,
  kappa,
  lambda,
  omega,
  alpha,
  precisionEnabled,
) {
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
      v.setT(s * (Math.cosh(angularDist) - 1.0))
    } else if (kappa > 0.0) {
      const s = 1 / Math.sqrt(kappa)
      v.setX(s * Math.sin(angularDist) * Math.cos(ascension) * Math.cos(declination))
      v.setY(s * Math.sin(angularDist) * Math.sin(ascension) * Math.cos(declination))
      v.setZ(s * Math.sin(angularDist) * Math.sin(declination))
      v.setT(s * (Math.cos(angularDist) - 1.0))
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
export function calcTargetsPos(
  targets,
  comovingSpaceFlag,
  kappa,
  lambda,
  omega,
  alpha,
  precisionEnabled,
) {
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
export function calcProjVects(RA1, Dec1, Beta) {
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

  if (Math.abs(P1.getX()) < 0.9) {
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

  return { E0, E1, E2, E3 }
}

/**
 * Compute projection for all targets.
 */
export function calcTargetsProj(targets, view, RA1, Dec1, Beta) {
  if (!targets) return

  const projVects = calcProjVects(RA1, Dec1, Beta)
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

// Data layout constants for SharedArrayBuffer
// Data layout constants for SharedArrayBuffer
import {
  OFFSET_REDSHIFT,
  OFFSET_RA,
  OFFSET_DEC,
  OFFSET_ANG_DIST,
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_POS_Z,
  OFFSET_POS_T,
  OFFSET_PROJ_X,
  OFFSET_PROJ_Y,
  STRIDE,
} from '@/logic/target.js'

/**
 * Helper to split targets into chunks for parallel processing.
 */
function splitIntoChunks(totalTargets, numChunks) {
  const chunks = []
  const chunkSize = Math.ceil(totalTargets / numChunks)

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, totalTargets)
    if (start < totalTargets) {
      chunks.push({
        start,
        end,
        count: end - start,
      })
    }
  }

  return chunks
}

/**
 * Parallel version of calcTargetsAngularDist().
 */
export async function calcTargetsAngularDistParallel(
  targets,
  kappa,
  lambda,
  omega,
  alpha,
  precisionEnabled,
  sharedBuffer = null,
) {
  if (!targets || targets.length === 0) return false

  try {
    const pool = await getProjectionWorkerPool()
    const numWorkers = pool.getWorkerCount()
    const totalTargets = targets.length

    // Create or use existing SharedArrayBuffer
    let buffer = sharedBuffer
    let float64View
    if (!buffer) {
      buffer = new SharedArrayBuffer(totalTargets * STRIDE * Float64Array.BYTES_PER_ELEMENT)
      float64View = new Float64Array(buffer)
      // Populate buffer with input data
      for (let i = 0; i < totalTargets; i++) {
        const t = targets[i]
        const offset = i * STRIDE
        float64View[offset + OFFSET_REDSHIFT] = t.redshift
      }
    }

    const chunks = splitIntoChunks(totalTargets, numWorkers)
    const chunkProgress = new Array(chunks.length).fill(0)
    const statusStore = useStatusStore()

    // Create tasks for each chunk
    const tasks = chunks.map((chunk, index) => {
      return {
        type: 'calcAngularDist',
        data: {
          buffer, // Pass the SharedArrayBuffer
          start: chunk.start,
          end: chunk.end,
          kappa,
          lambda,
          omega,
          alpha,
          precisionEnabled,
          stride: STRIDE,
          offsetRedshift: OFFSET_REDSHIFT,
          offsetAngDist: OFFSET_ANG_DIST,
        },
        onProgress: (p) => {
          chunkProgress[index] = p
          const totalProgress = chunkProgress.reduce((a, b) => a + b, 0) / chunks.length
          statusStore.setProgress(totalProgress)
        },
      }
    })

    // Execute in parallel
    await pool.executeParallel(tasks)

    // If we created the buffer locally, we need to write results back to targets
    if (!sharedBuffer) {
      float64View = new Float64Array(buffer)
      for (let i = 0; i < totalTargets; i++) {
        const offset = i * STRIDE
        targets[i].setAngularDist(float64View[offset + OFFSET_ANG_DIST])
      }
    }

    return true
  } catch (error) {
    console.warn('Parallel calcTargetsAngularDist failed, falling back to single-threaded:', error)
    return calcTargetsAngularDist(targets, kappa, lambda, omega, alpha, precisionEnabled)
  }
}

/**
 * Parallel version of calcTargetsPos().
 */
export async function calcTargetsPosParallel(
  targets,
  comovingSpaceFlag,
  kappa,
  lambda,
  omega,
  alpha,
  precisionEnabled,
  sharedBuffer = null,
) {
  if (!targets || targets.length === 0) return false

  try {
    const pool = await getProjectionWorkerPool()
    const numWorkers = pool.getWorkerCount()
    const totalTargets = targets.length

    let buffer = sharedBuffer
    let float64View
    if (!buffer) {
      buffer = new SharedArrayBuffer(totalTargets * STRIDE * Float64Array.BYTES_PER_ELEMENT)
      float64View = new Float64Array(buffer)
      // Populate buffer with input data
      for (let i = 0; i < totalTargets; i++) {
        const t = targets[i]
        const offset = i * STRIDE
        float64View[offset + OFFSET_ANG_DIST] = t.angularDistance
        float64View[offset + OFFSET_RA] = t.ascension
        float64View[offset + OFFSET_DEC] = t.declination
        float64View[offset + OFFSET_REDSHIFT] = t.redshift
      }
    }

    const chunks = splitIntoChunks(totalTargets, numWorkers)
    const chunkProgress = new Array(chunks.length).fill(0)
    const statusStore = useStatusStore()

    const tasks = chunks.map((chunk, index) => {
      return {
        type: 'calcPos',
        data: {
          buffer,
          start: chunk.start,
          end: chunk.end,
          comovingSpaceFlag,
          kappa,
          lambda,
          omega,
          alpha,
          precisionEnabled,
          stride: STRIDE,
          offsetAngDist: OFFSET_ANG_DIST,
          offsetRA: OFFSET_RA,
          offsetDec: OFFSET_DEC,
          offsetRedshift: OFFSET_REDSHIFT,
          offsetPosX: OFFSET_POS_X,
          offsetPosY: OFFSET_POS_Y,
          offsetPosZ: OFFSET_POS_Z,
          offsetPosT: OFFSET_POS_T,
        },
        onProgress: (p) => {
          chunkProgress[index] = p
          const totalProgress = chunkProgress.reduce((a, b) => a + b, 0) / chunks.length
          statusStore.setProgress(totalProgress)
        },
      }
    })

    await pool.executeParallel(tasks)

    if (!sharedBuffer) {
      float64View = new Float64Array(buffer)
      for (let i = 0; i < totalTargets; i++) {
        const offset = i * STRIDE
        const v = new Vect4d(
          float64View[offset + OFFSET_POS_X],
          float64View[offset + OFFSET_POS_Y],
          float64View[offset + OFFSET_POS_Z],
          float64View[offset + OFFSET_POS_T],
        )
        targets[i].setPos(v)
      }
    }

    return true
  } catch (error) {
    console.warn('Parallel calcTargetsPos failed, falling back to single-threaded:', error)
    return calcTargetsPos(targets, comovingSpaceFlag, kappa, lambda, omega, alpha, precisionEnabled)
  }
}

/**
 * Parallel version of calcTargetsProj().
 */
export async function calcTargetsProjParallel(
  targets,
  view,
  RA1,
  Dec1,
  Beta,
  sharedBuffer = null,
) {
  if (!targets || targets.length === 0) return

  try {
    const pool = await getProjectionWorkerPool()
    const numWorkers = pool.getWorkerCount()
    const totalTargets = targets.length

    let buffer = sharedBuffer
    let float64View
    if (!buffer) {
      buffer = new SharedArrayBuffer(totalTargets * STRIDE * Float64Array.BYTES_PER_ELEMENT)
      float64View = new Float64Array(buffer)
      // Populate buffer with input data
      for (let i = 0; i < totalTargets; i++) {
        const t = targets[i]
        const offset = i * STRIDE
        const pos = t.pos
        float64View[offset + OFFSET_POS_X] = pos.x
        float64View[offset + OFFSET_POS_Y] = pos.y
        float64View[offset + OFFSET_POS_Z] = pos.z
        float64View[offset + OFFSET_POS_T] = pos.t
      }
    }

    const chunks = splitIntoChunks(totalTargets, numWorkers)
    const chunkProgress = new Array(chunks.length).fill(0)
    const statusStore = useStatusStore()

    const tasks = chunks.map((chunk, index) => {
      return {
        type: 'calcProj',
        data: {
          buffer,
          start: chunk.start,
          end: chunk.end,
          view,
          RA1,
          Dec1,
          Beta,
          stride: STRIDE,
          offsetPosX: OFFSET_POS_X,
          offsetPosY: OFFSET_POS_Y,
          offsetPosZ: OFFSET_POS_Z,
          offsetPosT: OFFSET_POS_T,
          offsetProjX: OFFSET_PROJ_X,
          offsetProjY: OFFSET_PROJ_Y,
        },
        onProgress: (p) => {
          chunkProgress[index] = p
          const totalProgress = chunkProgress.reduce((a, b) => a + b, 0) / chunks.length
          statusStore.setProgress(totalProgress)
        },
      }
    })

    await pool.executeParallel(tasks)

    if (!sharedBuffer) {
      float64View = new Float64Array(buffer)
      for (let i = 0; i < totalTargets; i++) {
        const offset = i * STRIDE
        targets[i].setx(float64View[offset + OFFSET_PROJ_X])
        targets[i].sety(float64View[offset + OFFSET_PROJ_Y])
      }
    }
  } catch (error) {
    console.warn('Parallel calcTargetsProj failed, falling back to single-threaded:', error)
    calcTargetsProj(targets, view, RA1, Dec1, Beta)
  }
}

/**
 * Compute angular distance, position and projection for all targets, with parallelization if relevant.
 */
export async function updateAll(
  targets,
  view,
  RA1,
  Dec1,
  Beta,
  comovingSpaceFlag,
  kappa,
  lambda,
  omega,
  alpha,
  precisionEnabled,
) {
  const statusStore = useStatusStore()
  const catalogStore = useCatalogStore()

  statusStore.computationStart()

  // Use parallel computation for large datasets
  if (targets && targets.length >= PARALLEL_THRESHOLD) {
    try {
      let buffer = catalogStore.sharedBuffer

      statusStore.setStatusMessage('Computing angular distances [1/3]')
      statusStore.setProgress(0)
      await calcTargetsAngularDistParallel(
        targets,
        kappa,
        lambda,
        omega,
        alpha,
        precisionEnabled,
        buffer,
      )

      statusStore.setStatusMessage('Computing positions [2/3]')
      statusStore.setProgress(0)
      await calcTargetsPosParallel(
        targets,
        comovingSpaceFlag,
        kappa,
        lambda,
        omega,
        alpha,
        precisionEnabled,
        buffer,
      )

      statusStore.setStatusMessage('Computing projection [3/3]')
      statusStore.setProgress(0)
      statusStore.projComputationStart()
      await calcTargetsProjParallel(
        targets,
        view,
        RA1,
        Dec1,
        Beta,
        buffer,
      )
      statusStore.projComputationEnd()

      statusStore.setStatusMessage('Ready')
      statusStore.setProgress(100)
      statusStore.computationEnd()
      return
    } catch (error) {
      console.warn('Parallel computation failed, falling back to single-threaded:', error)
      // Fall through to single-threaded version
    }
  }

  statusStore.setStatusMessage('Computing (single-threaded)')
  // Single-threaded version for small datasets or fallback
  calcTargetsAngularDist(targets, kappa, lambda, omega, alpha, precisionEnabled)
  calcTargetsPos(targets, comovingSpaceFlag, kappa, lambda, omega, alpha, precisionEnabled)
  statusStore.projComputationStart()
  calcTargetsProj(targets, view, RA1, Dec1, Beta)
  statusStore.projComputationEnd()
  statusStore.setStatusMessage('Ready')
  statusStore.computationEnd()
}

/**
 * Compute projection for all targets, with parallelization if relevant.
 */
export async function updateView(targets, view, RA1, Dec1, Beta) {
  const statusStore = useStatusStore()
  const catalogStore = useCatalogStore()

  // Use parallel computation for large datasets.
  // Do not use it for partial datasets used to have smooth view upgrade, because targets are not contiguous in buffer.
  if (targets && targets === catalogStore.targets && targets.length >= PARALLEL_THRESHOLD) {
    try {
      let buffer = catalogStore.sharedBuffer

      statusStore.setStatusMessage('Computing projection')
      statusStore.setProgress(0)
      await calcTargetsProjParallel(
        targets,
        view,
        RA1,
        Dec1,
        Beta,
        buffer,
      )

      statusStore.setStatusMessage('Ready')
      statusStore.setProgress(100)
      return
    } catch (error) {
      console.warn('Parallel computation failed, falling back to single-threaded:', error)
      // Fall through to single-threaded version
    }
  }

  statusStore.setStatusMessage('Computing (single-threaded)')
  // Single-threaded version for small datasets or fallback
  calcTargetsProj(targets, view, RA1, Dec1, Beta)
  statusStore.setStatusMessage('Ready')
}
