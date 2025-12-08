import { polynomialP } from '@/logic/cosmologicalPolynomial.js'

/**
 * Pure function to calculate the evolution integrand
 * @param {number} x - Integration variable
 * @param {number} kappa - Curvature parameter
 * @param {number} lambda - Cosmological constant
 * @param {number} omega - Matter density parameter
 * @param {number} alpha - Radiation density parameter
 * @returns {number} The value of the integrand
 */
export function evolutionIntegrand(x, kappa, lambda, omega, alpha) {
  return 1.0 / Math.sqrt(polynomialP(x, kappa, lambda, omega, alpha))
}
