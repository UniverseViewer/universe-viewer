import { describe, it, expect } from 'vitest'
import { computeAngularDistance, computeComovingDistance, comovingDistanceToMpc, computeAngularSeparation } from '@/logic/measures.js'

// Mock Target class factory
const createTarget = (tau, ra, dec) => ({
  getAngularDist: () => tau,
  getAscension: () => ra,
  getDeclination: () => dec,
  getPos: () => {
      // Simple spherical to cartesian conversion for mocking
      // x = cos(ra)cos(dec), y = sin(ra)cos(dec), z = sin(dec)
      // Let's use magnitude 'tau' to be consistent with getAngularDist
      const r = tau;
      return {
          x: r * Math.cos(ra) * Math.cos(dec),
          y: r * Math.sin(ra) * Math.cos(dec),
          z: r * Math.sin(dec)
      }
  }
})

describe('Measures Logic', () => {
  describe('computeAngularSeparation', () => {
    it('should return 0 for identical targets', () => {
      const t1 = createTarget(1, Math.PI / 4, Math.PI / 4)
      const t2 = createTarget(1, Math.PI / 4, Math.PI / 4)
      expect(computeAngularSeparation(t1, t2)).toBeCloseTo(0, 5)
    })

    it('should return PI/2 for targets separated by 90 degrees (along equator)', () => {
      const t1 = createTarget(1, 0, 0)
      const t2 = createTarget(1, Math.PI / 2, 0)
      expect(computeAngularSeparation(t1, t2)).toBeCloseTo(Math.PI / 2, 5)
    })

    it('should return PI for targets separated by 180 degrees (antipodal)', () => {
      const t1 = createTarget(1, 0, 0)
      const t2 = createTarget(1, Math.PI, 0)
      expect(computeAngularSeparation(t1, t2)).toBeCloseTo(Math.PI, 5)
    })

    it('should return PI/2 for targets separated by 90 degrees (pole to equator)', () => {
      const t1 = createTarget(1, 0, Math.PI / 2) // North Pole
      const t2 = createTarget(1, 0, 0) // On equator
      expect(computeAngularSeparation(t1, t2)).toBeCloseTo(Math.PI / 2, 5)
    })

    it('should correctly calculate separation for arbitrary points', () => {
      // Example from spherical trigonometry: A(0, 0), B(PI/4, PI/4)
      // cos(separation) = cos(decA)cos(decB)cos(raA-raB) + sin(decA)sin(decB)
      // cos(separation) = cos(0)cos(PI/4)cos(0-PI/4) + sin(0)sin(PI/4)
      // cos(separation) = 1 * (1/sqrt(2)) * (1/sqrt(2)) + 0
      // cos(separation) = 1/2
      // separation = acos(1/2) = PI/3
      const t1 = createTarget(1, 0, 0)
      const t2 = createTarget(1, Math.PI / 4, Math.PI / 4)
      expect(computeAngularSeparation(t1, t2)).toBeCloseTo(Math.PI / 3, 5)
    })

    it('should handle negative declinations correctly', () => {
      const t1 = createTarget(1, 0, -Math.PI / 4)
      const t2 = createTarget(1, Math.PI / 4, -Math.PI / 4)
      // For t1(ra=0, dec=-PI/4), t2(ra=PI/4, dec=-PI/4)
      // cos(delta) = cos(dec1)cos(dec2)cos(ra1-ra2) + sin(dec1)sin(dec2)
      // cos(delta) = cos(-PI/4)cos(-PI/4)cos(-PI/4) + sin(-PI/4)sin(-PI/4)
      // cos(delta) = (1/sqrt(2))*(1/sqrt(2))*(1/sqrt(2)) + (-1/sqrt(2))*(-1/sqrt(2))
      // cos(delta) = 1/(2*sqrt(2)) + 1/2 = sqrt(2)/4 + 1/2 = (sqrt(2)+2)/4
      const expectedSeparation = Math.acos((Math.sqrt(2) + 2) / 4)
      expect(computeAngularSeparation(t1, t2)).toBeCloseTo(expectedSeparation, 5)
    })

    it('should calculate separation from Target 1 perspective (sky=1)', () => {
      // Earth at origin (implicitly)
      // Target 1 (Ref) at distance 10 on X axis (RA=0, Dec=0)
      // Target 2 (Other) at distance 20 on X axis (RA=0, Dec=0)
      // From T1, Earth is at -X, T2 is at +X. Angle is 180 degrees (PI).
      const t1 = createTarget(10, 0, 0)
      const t2 = createTarget(20, 0, 0)

      const separation = computeAngularSeparation(t1, t2, 1)
      expect(separation).toBeCloseTo(Math.PI, 5)
    })

    it('should calculate separation from Target 2 perspective (sky=2)', () => {
      // Earth at origin (implicitly)
      // Target 1 (Other) at distance 10 on X axis (RA=0, Dec=0)
      // Target 2 (Ref) at distance 20 on X axis (RA=0, Dec=0)
      // From T2, Earth is at -X, T1 is at -X. Angle is 0 degrees.
      const t1 = createTarget(10, 0, 0)
      const t2 = createTarget(20, 0, 0)

      const separation = computeAngularSeparation(t1, t2, 2)
      expect(separation).toBeCloseTo(0, 5)
    })

    it('should calculate 90 degree separation in T1 sky', () => {
      // Earth at origin (implicitly)
      // T1 at (10, 0, 0) -> Direction to Earth is (-1, 0, 0)
      // T2 at (10, 10, 0) -> Direction from T1 to T2 is (0, 10, 0) -> normalized (0, 1, 0)
      // Angle between (-1, 0, 0) and (0, 1, 0) is 90 degrees (PI/2)
      // T2 coordinates relative to origin:
      // dist = sqrt(100+100) = 10*sqrt(2)
      // ra = PI/4, dec = 0
      const t1 = createTarget(10, 0, 0)
      const t2 = createTarget(10 * Math.SQRT2, Math.PI/4, 0)

      const separation = computeAngularSeparation(t1, t2, 1)
      expect(separation).toBeCloseTo(Math.PI / 2, 5)
    })

    it('should return 0 if targets are identical when using sky=1 (dLen=0)', () => {
      const t1 = createTarget(10, 0, 0)
      const t2 = createTarget(10, 0, 0)
      expect(computeAngularSeparation(t1, t2, 1)).toBe(0)
    })

    it('should return 0 if reference target is at origin when using sky=1 (rLen=0)', () => {
      const t1 = createTarget(0, 0, 0) // At origin
      const t2 = createTarget(10, 0, 0)
      expect(computeAngularSeparation(t1, t2, 1)).toBe(0)
    })
  })

  describe('computeAngularDistance', () => {

    describe('Kappa = 0 (Flat Space)', () => {
      it('should calculate Euclidean distance along radial line (same line of sight)', () => {
        // Points on same line of sight (RA=0, Dec=0), different radial distances
        const t1 = createTarget(10, 0, 0)
        const t2 = createTarget(20, 0, 0)
        // In flat space, d^2 = r1^2 + r2^2 - 2*r1*r2*cos(0) = (r1-r2)^2 => d = |r1-r2|
        const dist = computeAngularDistance(t1, t2, 0)
        expect(dist).toBeCloseTo(10, 5)
      })

      it('should calculate Euclidean distance for orthogonal points', () => {
        // Points at same radius 10, separated by 90 degrees (RA 0 vs PI/2, Dec 0)
        const t1 = createTarget(10, 0, 0)
        const t2 = createTarget(10, Math.PI / 2, 0)
        // cosTheta = cos(pi/2)*... = 0
        // d^2 = 10^2 + 10^2 - 0 = 200 => d = 10*sqrt(2)
        const dist = computeAngularDistance(t1, t2, 0)
        expect(dist).toBeCloseTo(10 * Math.SQRT2, 5)
      })

      it('should return 0 for identical points', () => {
        const t1 = createTarget(5, 1, 1)
        const dist = computeAngularDistance(t1, t1, 0)
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
        const dist = computeAngularDistance(t1, t2, k)
        expect(dist).toBeCloseTo(0.3, 5)
      })

      it('should calculate distance for orthogonal points on "equator" of 3-sphere', () => {
        // t1 = t2 = PI/2 (on the "equator" of the hypersphere relative to origin)
        // angle between them = 90 deg (cosTheta = 0)
        // formula: cos(d) = 0 * ... + cos(pi/2)cos(pi/2) = 0 + 0 = 0
        // d = PI/2
        const t1 = createTarget(Math.PI / 2, 0, 0)
        const t2 = createTarget(Math.PI / 2, Math.PI / 2, 0)
        const dist = computeAngularDistance(t1, t2, k)
        expect(dist).toBeCloseTo(Math.PI / 2, 5)
      })

      it('should handle clamping for identical points', () => {
        // cos(d) calculation might slightly exceed 1.0 due to float precision
        const t1 = createTarget(1.0, 0.5, 0.5)
        // Force same object
        const dist = computeAngularDistance(t1, t1, k)
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
        const dist = computeAngularDistance(t1, t2, k)
        expect(dist).toBeCloseTo(1.0, 5)
      })

      it('should calculate distance for orthogonal points', () => {
        // t1 = t2 = 1.0
        // angle = 90 deg (cosTheta = 0)
        // formula: cosh(d) = cosh(1)^2 - 0 = cosh(1)^2
        const t1 = createTarget(1.0, 0, 0)
        const t2 = createTarget(1.0, Math.PI / 2, 0)

        const expectedCosh = Math.cosh(1.0) ** 2
        const dist = computeAngularDistance(t1, t2, k)
        expect(Math.cosh(dist)).toBeCloseTo(expectedCosh, 5)
      })

      it('should handle clamping for identical points', () => {
        const t1 = createTarget(1.5, 0.1, 0.2)
        const dist = computeAngularDistance(t1, t1, k)
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

  describe('comovingDistanceToMpc', () => {
    const C_KM_S = 299792.458

    it('should calculate correct Mpc distance for standard values', () => {
      const tau = 0.5
      const h0 = 70
      const expected = (0.5 * C_KM_S) / 70
      expect(comovingDistanceToMpc(tau, h0)).toBeCloseTo(expected, 5)
    })

    it('should return 0 if tau is 0', () => {
      expect(comovingDistanceToMpc(0, 70)).toBe(0)
    })

    it('should return 0 if h0 is 0', () => {
      expect(comovingDistanceToMpc(1.0, 0)).toBe(0)
    })

    it('should return 0 if h0 is missing (null/undefined)', () => {
      expect(comovingDistanceToMpc(1.0, null)).toBe(0)
      expect(comovingDistanceToMpc(1.0, undefined)).toBe(0)
    })
  })
})
