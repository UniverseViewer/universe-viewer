/*
 * Copyright (C) 2025 Mathieu Abati <mathieu.abati@gmail.com>
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

/**
 * Projection Worker
 * Performs parallel computation of target projections
 */

// Import shared utility functions
import { computeAngularDist, computePos, computeProj, calcProjVects } from './projection.js'

// Worker message handler
self.onmessage = function (e) {
  const { id, type, data } = e.data
  // Pass ID to data so calculation functions can send progress with it
  data.id = id

  try {
    switch (type) {
      case 'calcAngularDist':
        calcAngularDist(data)
        break
      case 'calcPos':
        calcPos(data)
        break
      case 'calcProj':
        calcProj(data)
        break
      default:
        throw new Error(`Unknown task type: ${type}`)
    }
    self.postMessage({ id, result: true })
  } catch (error) {
    self.postMessage({ id, error: error.message })
  }
}

/**
 * Calculate angular distance for a chunk of targets.
 */
function calcAngularDist(data) {
  const {
    buffer,
    start,
    end,
    kappa,
    lambda,
    omega,
    alpha,
    precisionEnabled,
    stride,
    offsetRedshift,
    offsetAngDist,
  } = data

  const float64View = new Float64Array(buffer)
  const total = end - start
  const progressStep = Math.ceil(total / 20) // Report every 5%

  for (let i = 0; i < total; i++) {
    if (i % progressStep === 0) {
      self.postMessage({ id: data.id, progress: (i / total) * 100 })
    }

    const index = start + i
    const offset = index * stride
    const redshift = float64View[offset + offsetRedshift]

    const angularDist = computeAngularDist(redshift, kappa, lambda, omega, alpha, precisionEnabled)

    float64View[offset + offsetAngDist] = angularDist
  }

  return true
}

/*
 * Calculate positions for a chunk of targets.
 */
function calcPos(data) {
  const {
    buffer,
    start,
    end,
    comovingSpaceFlag,
    kappa,
    lambda,
    omega,
    alpha,
    precisionEnabled,
    stride,
    offsetAngDist,
    offsetRA,
    offsetDec,
    offsetRedshift,
    offsetPosX,
    offsetPosY,
    offsetPosZ,
    offsetPosT,
  } = data

  const float64View = new Float64Array(buffer)
  const total = end - start
  const progressStep = Math.ceil(total / 20) // Report every 5%

  for (let i = 0; i < total; i++) {
    if (i % progressStep === 0) {
      self.postMessage({ id: data.id, progress: (i / total) * 100 })
    }

    const index = start + i
    const offset = index * stride

    const angularDist = float64View[offset + offsetAngDist]
    const ascension = float64View[offset + offsetRA]
    const declination = float64View[offset + offsetDec]
    const redshift = float64View[offset + offsetRedshift]

    const v = computePos(
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
    )

    float64View[offset + offsetPosX] = v.x
    float64View[offset + offsetPosY] = v.y
    float64View[offset + offsetPosZ] = v.z
    float64View[offset + offsetPosT] = v.t
  }

  return true
}

/*
 * Calculate projections for a chunk of targets.
 */
function calcProj(data) {
  const {
    buffer,
    start,
    end,
    view,
    RA1,
    Dec1,
    Beta,
    comovingSpaceFlag,
    kappa,
    stride,
    offsetPosX,
    offsetPosY,
    offsetPosZ,
    offsetPosT,
    offsetProjX,
    offsetProjY,
  } = data

  const projVects = calcProjVects(RA1, Dec1, Beta, comovingSpaceFlag, kappa)
  const E0 = projVects.E0
  const E1 = projVects.E1
  const E2 = projVects.E2
  const E3 = projVects.E3

  const float64View = new Float64Array(buffer)
  const total = end - start
  const progressStep = Math.ceil(total / 20) // Report every 5%

  for (let i = 0; i < total; i++) {
    if (i % progressStep === 0) {
      self.postMessage({ id: data.id, progress: (i / total) * 100 })
    }

    const index = start + i
    const offset = index * stride

    const pos = {
      x: float64View[offset + offsetPosX],
      y: float64View[offset + offsetPosY],
      z: float64View[offset + offsetPosZ],
      t: float64View[offset + offsetPosT],
    }

    const { x, y } = computeProj(pos, view, E0, E1, E2, E3)

    float64View[offset + offsetProjX] = x
    float64View[offset + offsetProjY] = y
  }

  return true
}
