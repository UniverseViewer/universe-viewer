import { describe, it, expect } from 'vitest'
import { getSumConsts, validateCosmoParams, isCosmoParamsValid } from '@/logic/paramsConstraints.js'

describe('Cosmological Parameters Constraints Logic', () => {

  describe('getSumConsts', () => {
    it('should calculate the sum correctly: lambda - kappa + omega + alpha', () => {
      // 0.7 - 0 + 0.3 + 0 = 1.0
      expect(getSumConsts(0.7, 0.3, 0, 0)).toBeCloseTo(1.0, 5)

      // 0 - (-0.8) + 0.2 + 0 = 1.0
      expect(getSumConsts(0, 0.2, -0.8, 0)).toBeCloseTo(1.0, 5)

      // 0.5 - 0.2 + 0.4 + 0.1 = 0.8
      expect(getSumConsts(0.5, 0.4, 0.2, 0.1)).toBeCloseTo(0.8, 5)
    })
  })

  describe('validateCosmoParams', () => {
    // Valid Sets
    it('should accept valid standard flat universe parameters', () => {
      // Lambda=0.7, Omega=0.3, Kappa=0, Alpha=0
      // Sum = 1.0.
      // Cubic: 6.75 * 0.7 * 0.3^2 = 0.425 > 0^3. Valid.
      // ComovingSpace: required for K=0
      expect(() => validateCosmoParams(0.7, 0.3, 0, 0, true)).not.toThrow()
    })

    it('should accept valid open universe parameters', () => {
      // Lambda=0, Omega=0.2, Kappa=-0.8, Alpha=0
      // Sum = 1.0.
      // Cubic: 0 > -0.512. Valid.
      expect(() => validateCosmoParams(0, 0.2, -0.8, 0, false)).not.toThrow()
    })

    // Sum Constraint
    it('should throw if sum constraint is broken', () => {
      // Sum != 1.0
      // 0.7 - 0 + 0.4 + 0 = 1.1
      expect(() => validateCosmoParams(0.7, 0.4, 0, 0, true)).toThrow(/lambda - kappa \+ omega \+ alpha = 1\.0/)
    })

    // Omega Constraint
    it('should throw if omega is negative', () => {
      // Omega = -0.1. To keep sum=1, adjust something else.
      // L=1.1, O=-0.1, K=0, A=0 -> Sum=1.0
      expect(() => validateCosmoParams(1.1, -0.1, 0, 0, true)).toThrow(/omega >= 0/)
    })

    // Cubic Constraint
    it('should throw if cubic inequality is broken (Bouncing Universe)', () => {
      // Need (27/4) * L * O^2 <= K^3
      // Let L=0. O=2.0. A=0.
      // K = L + O + A - 1 = 1.0.
      // LHS = 0. RHS = 1. 0 > 1 is False.
      expect(() => validateCosmoParams(0, 2.0, 1.0, 0, false)).toThrow(/\(27\/4\) \* lambda \* omega² > kappa\^3/)
    })

    // Comoving Space / Kappa Constraint
    it('should throw if kappa is 0 and comovingSpaceFlag is false', () => {
      expect(() => validateCosmoParams(0.7, 0.3, 0, 0, false)).toThrow(/kappa can be equal to zero only if comoving space is enabled!/)
    })

    it('should not throw if kappa is 0 and comovingSpaceFlag is true', () => {
      expect(() => validateCosmoParams(0.7, 0.3, 0, 0, true)).not.toThrow()
    })

    it('should not throw if kappa is non-zero and comovingSpaceFlag is false', () => {
      // Open universe
      expect(() => validateCosmoParams(0, 0.2, -0.8, 0, false)).not.toThrow()
    })
  })

  describe('isCosmoParamsValid', () => {
    it('should return true for valid parameters', () => {
      expect(isCosmoParamsValid(0.7, 0.3, 0, 0, true)).toBe(true)
    })

    it('should return false if validateCosmoParams throws', () => {
      // Sum mismatch
      expect(isCosmoParamsValid(0.8, 0.3, 0, 0, true)).toBe(false)
      // Kappa=0 issue
      expect(isCosmoParamsValid(0.7, 0.3, 0, 0, false)).toBe(false)
    })

    it('should return false if lambda is negative (soft check)', () => {
      expect(isCosmoParamsValid(-0.1, 0.1, -1.0, 0, false)).toBe(false)
    })

    it('should return false if alpha is negative (soft check)', () => {
      expect(isCosmoParamsValid(0.7, 0.3, -0.1, -0.1, true)).toBe(false)
    })
  })
})
