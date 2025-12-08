/**
 * Calculate the polynomial P(a).
 * @param {number} a - Expansion parameter.
 * @param {number} kappa - Curvature parameter.
 * @param {number} lambda - Cosmological constant.
 * @param {number} omega - Density parameter.
 * @param {number} alpha - Accounts for the presence of CMB photons as sources of gravity.
 * @returns {number} The value of P(a)
 */
export function polynomialP(a, kappa, lambda, omega, alpha) {
  return lambda * Math.pow(a, 4) - kappa * a * a + omega * a + alpha
}
