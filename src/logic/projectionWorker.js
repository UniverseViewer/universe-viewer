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
    let result

    switch (type) {
      case 'calcAngularDist':
        result = calcAngularDist(data)
        break
      case 'calcPos':
        result = calcPos(data)
        break
      case 'calcProj':
        result = calcProj(data)
        break
      default:
        throw new Error(`Unknown task type: ${type}`)
    }

    self.postMessage({ id, result })
  } catch (error) {
    self.postMessage({ id, error: error.message })
  }
}

/**
 * Calculate angular distance for a chunk of targets.
 */
function calcAngularDist(data) {
  const { targets, kappa, lambda, omega, alpha, precisionEnabled } = data

  const total = targets.length
  const progressStep = Math.ceil(total / 20) // Report every 5%

  const results = targets.map((target, index) => {
    if (index % progressStep === 0) {
      self.postMessage({ id: data.id, progress: (index / total) * 100 })
    }
    const angularDist = computeAngularDist(
      target.redshift,
      kappa,
      lambda,
      omega,
      alpha,
      precisionEnabled,
    )
    return { angularDistance: angularDist }
  })

  return results
}

/*
 * Calculate positions for a chunk of targets.
 */
function calcPos(data) {
  const { targets, comovingSpaceFlag, kappa, lambda, omega, alpha, precisionEnabled } = data

  const results = []

  const total = targets.length
  const progressStep = Math.ceil(total / 20) // Report every 5%

  for (let i = 0; i < total; i++) {
    if (i % progressStep === 0) {
      self.postMessage({ id: data.id, progress: (i / total) * 100 })
    }
    const t = targets[i]
    const v = computePos(
      comovingSpaceFlag,
      t.angularDistance,
      t.ascension,
      t.declination,
      t.redshift,
      kappa,
      lambda,
      omega,
      alpha,
      precisionEnabled,
    )
    results.push({ pos: { x: v.x, y: v.y, z: v.z, t: v.t } })
  }

  return results
}

/*
 * Calculate projections for a chunk of targets.
 */
function calcProj(data) {
  const { targets, view, RA1, Dec1, Beta, comovingSpaceFlag, kappa } = data

  const projVects = calcProjVects(RA1, Dec1, Beta, comovingSpaceFlag, kappa)
  const E0 = projVects.E0
  const E1 = projVects.E1
  const E2 = projVects.E2
  const E3 = projVects.E3

  const results = []

  const total = targets.length
  const progressStep = Math.ceil(total / 20) // Report every 5%

  for (let i = 0; i < total; i++) {
    if (i % progressStep === 0) {
      self.postMessage({ id: data.id, progress: (i / total) * 100 })
    }
    const { x, y } = computeProj(targets[i].pos, view, E0, E1, E2, E3)
    results.push({ x, y })
  }

  return results
}
