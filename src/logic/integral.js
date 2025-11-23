/**
 * Integral computation (slow, high precision)
 */

import { useUniverseStore } from '@/stores/universe.js'

export function poly(a) {
  const store = useUniverseStore()
  return (
    store.lambda * Math.pow(a, 4) -
    store.kappa * a * a +
    store.omega * a +
    store.alpha
  )
}

export function funcToIntegrate(x) {
  return 1.0 / Math.sqrt(poly(x))
}

/**
 * Numerical integration using fixed step trapezoidal rule
 * @param {number} limitA - start of interval
 * @param {number} limitB - end of interval
 * @param {number} stepH - step size
 * @returns {number}
 */
export function integrate(limitA, limitB, stepH) {
  let sum = 0

  // Calculate number of steps to cover the interval exactly
  const n = Math.ceil(Math.abs(limitB - limitA) / stepH)
  const realStep = (limitB - limitA) / n

  for (let i = 1; i < n; i++) {
    sum += funcToIntegrate(limitA + i * realStep)
  }

  sum *= realStep

  return (realStep / 2) * (funcToIntegrate(limitA) + funcToIntegrate(limitB)) + sum
}
