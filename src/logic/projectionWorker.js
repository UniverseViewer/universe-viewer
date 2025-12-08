/**
 * Projection Worker
 * Performs parallel computation of target projections
 */

// Import shared utility functions
import { computeAngularDist, computePos, computeProj, calcProjVects } from './projection.js'

// Worker message handler
self.onmessage = function (e) {
  const { id, type, data } = e.data

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

  const results = targets.map((target) => {
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

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]
    const v = computePos(
      t.angularDistance,
      t.ascension,
      t.declination,
      t.redshift,
      comovingSpaceFlag,
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

  for (let i = 0; i < targets.length; i++) {
    const { x, y } = computeProj(targets[i].pos, view, E0, E1, E2, E3)
    results.push({ x, y })
  }

  return results
}
