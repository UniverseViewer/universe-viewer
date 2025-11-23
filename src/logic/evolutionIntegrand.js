import { polynomialP } from '@/logic/cosmologicalPolynomial.js'

/**
 * The integrand part of the cosmological evolution equation.
 * @param {number} x - The scale factor 'a'.
 * @returns {number} The value of 1.0 / sqrt(P(x)).
 */
export function evolutionIntegrand(x) {
  return 1.0 / Math.sqrt(polynomialP(x))
}
