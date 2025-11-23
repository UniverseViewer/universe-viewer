/**
 * Integral computation (slow, high precision)
 */

/**
 * Numerical integration using fixed step trapezoidal rule
 * @param {number} limitA - start of interval
 * @param {number} limitB - end of interval
 * @param {number} stepH - step size
 * @param {function} funcToIntegrate - the function to integrate
 * @returns {number}
 */
export function integrate(limitA, limitB, stepH, funcToIntegrate) {
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
