import { describe, it, expect } from 'vitest'
import * as trapezoidal from '@/logic/trapezoidalIntegral.js'
import * as romberg from '@/logic/rombergIntegral.js'
import { evolutionIntegrand } from '@/logic/evolutionIntegrand.js'
import { polynomialP } from '@/logic/cosmologicalPolynomial.js'

describe('Integral and Cosmological Functions', () => {

  describe('cosmologicalPolynomial (P(a))', () => {
    // P(a) = lambda*a^4 - kappa*a^2 + omega*a + alpha

    it('should return correct value for standard flat model', () => {
      // P(a) = 0.7a^4 + 0.3a
      const val = polynomialP(1.0, 0, 0.7, 0.3, 0)
      expect(val).toBeCloseTo(1.0, 10)
    })

    it('should calculate P(a) for a=0.5', () => {
       // P(0.5) = 0.7*(0.0625) + 0.3*0.5 = 0.04375 + 0.15 = 0.19375
       const val = polynomialP(0.5, 0, 0.7, 0.3, 0)
       expect(val).toBeCloseTo(0.19375, 10)
    })

    it('should handle negative curvature', () => {
       // Open universe: k = -1, l=0, o=0.1
       // P(a) = -(-1)a^2 + 0.1a = a^2 + 0.1a
       // P(1) = 1.1
       const val = polynomialP(1.0, -1.0, 0, 0.1, 0)
       expect(val).toBeCloseTo(1.1, 10)
    })
  })

  describe('evolutionIntegrand', () => {
    // Integrand = 1 / sqrt(P(a))

    it('should calculate integrand correctly', () => {
       // P(0.5) for flat model was 0.19375
       // Expected = 1 / sqrt(0.19375) approx 2.2717
       const val = evolutionIntegrand(0.5, 0, 0.7, 0.3, 0)
       expect(val).toBeCloseTo(1 / Math.sqrt(0.19375), 5)
    })

    it('should return Infinity if P(a) is 0 (Singularity)', () => {
      // P(a) = a for L=0, K=0, O=1
      // at a=0, P(0)=0. 1/0 = Infinity
      const val = evolutionIntegrand(0, 0, 0, 1, 0)
      expect(val).toBe(Infinity)
    })
  })

  // Reusable test suite for integration methods
  const runIntegrationTests = (methodName, integrateFn, stepOrIter) => {
    describe(`${methodName} Integration`, () => {

      it('should integrate constant function f(x)=1 correctly', () => {
        // Int(1, 0..1) = 1
        const result = integrateFn(0, 1, stepOrIter, () => 1)
        expect(result).toBeCloseTo(1.0, 3)
      })

      it('should integrate linear function f(x)=x correctly', () => {
        // Int(x, 0..1) = 0.5
        const result = integrateFn(0, 1, stepOrIter, (x) => x)
        expect(result).toBeCloseTo(0.5, 3)
      })

      it('should integrate x^2 correctly', () => {
         // Int(x^2, 0..1) = 1/3
         const result = integrateFn(0, 1, stepOrIter, (x) => x*x)
         expect(result).toBeCloseTo(1.0/3.0, 3)
      })

      it('should integrate sin(x) from 0 to PI correctly', () => {
         // Int(sin(x), 0..PI) = [-cos(x)] = -(-1) - (-1) = 2
         const result = integrateFn(0, Math.PI, stepOrIter, Math.sin)
         expect(result).toBeCloseTo(2.0, 3)
      })

      it('should handle zero interval', () => {
        const result = integrateFn(1, 1, stepOrIter, (x) => x)
        expect(result).toBeCloseTo(0, 5)
      })

      it('should handle negative direction (B < A)', () => {
        // Int(x, 1..0) = -0.5
        const result = integrateFn(1, 0, stepOrIter, (x) => x)
        expect(result).toBeCloseTo(-0.5, 3)
      })
    })
  }

  // Test Trapezoidal (stepH = 0.001)
  runIntegrationTests('Trapezoidal', trapezoidal.integrate, 0.001)

  // Test Romberg (n = 6 iterations)
  // Romberg needs more iterations for decent precision on general functions compared to a fixed small step trapezoidal
  runIntegrationTests('Romberg', romberg.integrate, 6)

  // Specific limits/comparisons
  describe('Integration Method Comparison (Cosmology)', () => {
     it('should produce similar results for cosmological distance', () => {
        const z = 1.0
        const zInv = 1.0 / (1.0 + z)
        const integrand = (x) => evolutionIntegrand(x, 0, 0.7, 0.3, 0)

        const trapRes = trapezoidal.integrate(zInv, 1.0, 0.001, integrand)
        const rombRes = romberg.integrate(zInv, 1.0, 6, integrand)

        // They should match within reasonable tolerance (e.g. 1e-4)
        expect(Math.abs(trapRes - rombRes)).toBeLessThan(1e-4)
     })
  })
})
