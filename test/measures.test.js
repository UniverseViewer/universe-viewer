import { describe, it, expect } from 'vitest'
import { computeReferenceDistance, computeComovingDistance } from '@/logic/measures.js'

// Mock Target class factory
const createTarget = (tau, ra, dec) => ({
  getAngularDist: () => tau,
  getAscension: () => ra,
  getDeclination: () => dec,
})

describe('Measures Logic', () => {
  describe('computeReferenceDistance', () => {

    describe('Kappa = 0 (Flat Space)', () => {
      it('should calculate Euclidean distance along radial line (same line of sight)', () => {
        // Points on same line of sight (RA=0, Dec=0), different radial distances
        const t1 = createTarget(10, 0, 0)
        const t2 = createTarget(20, 0, 0)
        // In flat space, d^2 = r1^2 + r2^2 - 2*r1*r2*cos(0) = (r1-r2)^2 => d = |r1-r2|
        const dist = computeReferenceDistance(t1, t2, 0)
        expect(dist).toBeCloseTo(10, 5)
      })

      it('should calculate Euclidean distance for orthogonal points', () => {
        // Points at same radius 10, separated by 90 degrees (RA 0 vs PI/2, Dec 0)
        const t1 = createTarget(10, 0, 0)
        const t2 = createTarget(10, Math.PI / 2, 0)
        // cosTheta = cos(pi/2)*... = 0
        // d^2 = 10^2 + 10^2 - 0 = 200 => d = 10*sqrt(2)
        const dist = computeReferenceDistance(t1, t2, 0)
        expect(dist).toBeCloseTo(10 * Math.SQRT2, 5)
      })

      it('should return 0 for identical points', () => {
        const t1 = createTarget(5, 1, 1)
        const dist = computeReferenceDistance(t1, t1, 0)
        expect(dist).toBe(0)
      })
    })

    describe('Kappa > 0 (Spherical Space)', () => {
      const k = 1.0 // Simplifies math

      it('should calculate distance along radial line', () => {
        // cos(theta) = 1
        // formula: cos(d) = 1 * sin(t1)sin(t2) + cos(t1)cos(t2) = cos(t1-t2)
        // d = |t1 - t2|
        const t1 = createTarget(0.5, 0, 0)
        const t2 = createTarget(0.2, 0, 0)
        const dist = computeReferenceDistance(t1, t2, k)
        expect(dist).toBeCloseTo(0.3, 5)
      })

      it('should calculate distance for orthogonal points on "equator" of 3-sphere', () => {
        // t1 = t2 = PI/2 (on the "equator" of the hypersphere relative to origin)
        // angle between them = 90 deg (cosTheta = 0)
        // formula: cos(d) = 0 * ... + cos(pi/2)cos(pi/2) = 0 + 0 = 0
        // d = PI/2
        const t1 = createTarget(Math.PI / 2, 0, 0)
        const t2 = createTarget(Math.PI / 2, Math.PI / 2, 0)
        const dist = computeReferenceDistance(t1, t2, k)
        expect(dist).toBeCloseTo(Math.PI / 2, 5)
      })

      it('should handle clamping for identical points', () => {
        // cos(d) calculation might slightly exceed 1.0 due to float precision
        const t1 = createTarget(1.0, 0.5, 0.5)
        // Force same object
        const dist = computeReferenceDistance(t1, t1, k)
        expect(dist).toBe(0) // acos(1)
      })
    })

    describe('Kappa < 0 (Hyperbolic Space)', () => {
      const k = -1.0

      it('should calculate distance along radial line', () => {
        // cos(theta) = 1
        // formula: cosh(d) = cosh(t1)cosh(t2) - 1 * sinh(t1)sinh(t2) = cosh(t1 - t2)
        // d = |t1 - t2|
        const t1 = createTarget(2.0, 0, 0)
        const t2 = createTarget(1.0, 0, 0)
        const dist = computeReferenceDistance(t1, t2, k)
        expect(dist).toBeCloseTo(1.0, 5)
      })

      it('should calculate distance for orthogonal points', () => {
        // t1 = t2 = 1.0
        // angle = 90 deg (cosTheta = 0)
        // formula: cosh(d) = cosh(1)^2 - 0 = cosh(1)^2
        const t1 = createTarget(1.0, 0, 0)
        const t2 = createTarget(1.0, Math.PI / 2, 0)

        const expectedCosh = Math.cosh(1.0) ** 2
        const dist = computeReferenceDistance(t1, t2, k)
        expect(Math.cosh(dist)).toBeCloseTo(expectedCosh, 5)
      })

      it('should handle clamping for identical points', () => {
        const t1 = createTarget(1.5, 0.1, 0.2)
        const dist = computeReferenceDistance(t1, t1, k)
        expect(dist).toBeCloseTo(0, 5) // acosh(1)
      })
    })
  })

  describe('computeComovingDistance', () => {
    it('should scale by 1/sqrt(|k|) for Kappa != 0', () => {
      const k = -4.0 // sqrt(|k|) = 2
      const t1 = createTarget(2.0, 0, 0)
      const t2 = createTarget(1.0, 0, 0)

      // Reference distance (angular) for radial points is |2.0 - 1.0| = 1.0
      // Comoving distance = 1.0 / 2 = 0.5
      const dist = computeComovingDistance(t1, t2, k)
      expect(dist).toBeCloseTo(0.5, 5)
    })

    it('should return raw reference distance for Kappa = 0', () => {
      const t1 = createTarget(10, 0, 0)
      const t2 = createTarget(20, 0, 0)
      // Ref dist = 10
      const dist = computeComovingDistance(t1, t2, 0)
      expect(dist).toBeCloseTo(10, 5)
    })

    it('should work with positive Kappa scaling', () => {
        const k = 0.25 // sqrt(k) = 0.5
        const t1 = createTarget(1.0, 0, 0)
        const t2 = createTarget(0.5, 0, 0)
        // Ref dist = 0.5
        // Comoving = 0.5 / 0.5 = 1.0
        const dist = computeComovingDistance(t1, t2, k)
        expect(dist).toBeCloseTo(1.0, 5)
    })
  })
})
