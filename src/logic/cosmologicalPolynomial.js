import { useUniverseStore } from '@/stores/universe.js'

/**
 * The cosmological polynomial P(a) from equation (3) in cosmography.pdf.
 * @param {number} a - The scale factor.
 * @returns {number} The value of the polynomial.
 */
export function polynomialP(a) {
  const store = useUniverseStore()
  return (
    store.lambda * Math.pow(a, 4) -
    store.kappa * a * a +
    store.omega * a +
    store.alpha
  )
}
