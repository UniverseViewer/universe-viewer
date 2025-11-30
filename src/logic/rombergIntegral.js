/**
 * Integral computation (fast, low precision)
 */

let width = 0

function ff(x, limitA, funcToIntegrate) {
  return funcToIntegrate(limitA + width * x)
}

/**
 * Fast integration using recursive refinement (Romberg-like)
 * @param {number} limitA - interval start
 * @param {number} limitB - interval end
 * @param {number} n - number of refinement steps
 * @param {function} funcToIntegrate - the function to integrate
 */
export function integrate(limitA, limitB, n, funcToIntegrate) {
  const maximum = 15
  let t = new Array(maximum).fill(0)

  width = limitB - limitA

  let s = 1
  let e = 1

  // Initial trapezoidal estimate
  t[0] = 0.5 * (ff(0, limitA, funcToIntegrate) + ff(1, limitA, funcToIntegrate))

  // First loop
  for (let j = 1; j < n; j++) {
    s = 0.5 * s
    t[j] = 0

    for (let k = 1; k <= e; k++) {
      t[j] += ff(s * (2 * k - 1), limitA, funcToIntegrate)
    }

    t[j] = s * t[j] + 0.5 * t[j - 1]
    e = 2 * e
  }

  let ee = 1
  let kk = 1

  // Richardson extrapolation
  for (let j = 1; j < n; j++) {
    ee = 4 * ee
    kk = kk * (ee - 1)

    for (let k = 0; k < n - j; k++) {
      t[k] = ee * t[k + 1] - t[k]
    }
  }

  return (width * t[0]) / kk
}
