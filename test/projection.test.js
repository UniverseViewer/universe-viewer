import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as projection from '@/logic/projection.js'
import Vect3d from '@/logic/vect3d.js'
import Vect4d from '@/logic/vect4d.js'

// Mock the store modules to avoid Pinia errors during module import
vi.mock('@/stores/status.js', () => ({
  useStatusStore: () => ({
    computationStart: vi.fn(),
    computationEnd: vi.fn(),
    setStatusMessage: vi.fn(),
    setProgress: vi.fn(),
    projComputationStart: vi.fn(),
    projComputationEnd: vi.fn(),
  }),
}))

vi.mock('@/stores/targets.js', () => ({
  useTargetsStore: () => ({
    touch: vi.fn(),
    sharedBuffer: null,
  }),
}))

vi.mock('@/logic/workerPool.js', () => ({
  getProjectionWorkerPool: vi.fn(),
}))

describe('Projection Logic', () => {
  // Common cosmological parameters for testing
  // Flat model: Lambda=0.7, Omega=0.3, Kappa=0
  const flatParams = {
    kappa: 0,
    lambda: 0.7,
    omega: 0.3,
    alpha: 0,
  }

  // Closed model: Omega=1.2, Lambda=0 -> Kappa = 1.2 + 0 + 0 - 1 = 0.2
  const closedParams = {
    kappa: 0.2,
    lambda: 0,
    omega: 1.2,
    alpha: 0,
  }

  // Open model: Omega=0.2, Lambda=0 -> Kappa = 0.2 + 0 + 0 - 1 = -0.8
  const openParams = {
    kappa: -0.8,
    lambda: 0,
    omega: 0.2,
    alpha: 0,
  }

  describe('computeAngularDist', () => {
    it('should return 0 for redshift 0', () => {
      const dist = projection.computeAngularDist(0, 0, 0.7, 0.3, 0, false)
      expect(dist).toBeCloseTo(0, 5)
    })

    it('should return positive distance for z > 0 (Flat)', () => {
      const dist = projection.computeAngularDist(1.0, 0, 0.7, 0.3, 0, false)
      expect(dist).toBeGreaterThan(0)
    })

    it('should handle closed universe (Kappa > 0)', () => {
      const { kappa, lambda, omega, alpha } = closedParams
      const dist = projection.computeAngularDist(1.0, kappa, lambda, omega, alpha, false)
      expect(dist).toBeGreaterThan(0)
      expect(dist).not.toBeNaN()
    })

    it('should handle open universe (Kappa < 0)', () => {
      const { kappa, lambda, omega, alpha } = openParams
      const dist = projection.computeAngularDist(1.0, kappa, lambda, omega, alpha, false)
      expect(dist).toBeGreaterThan(0)
      expect(dist).not.toBeNaN()
    })
  })

  describe('computePos', () => {
    // Arbitrary angular distance
    const angDist = 0.5
    const ra = Math.PI / 4 // 45 deg
    const dec = Math.PI / 4 // 45 deg
    const z = 1.0

    it('should return a Vect4d', () => {
      const pos = projection.computePos(false, angDist, ra, dec, z, 0, 0.7, 0.3, 0, false)
      expect(pos).toBeInstanceOf(Vect4d)
    })

    it('should compute correctly for Flat space (Kappa=0) in Reference Space (!comovingSpaceFlag)', () => {
      const { kappa, lambda, omega, alpha } = flatParams
      const pos = projection.computePos(false, angDist, ra, dec, z, kappa, lambda, omega, alpha, false)

      // For flat space ref frame:
      // x = cd * cos(ra) * cos(dec)
      // y = cd * sin(ra) * cos(dec)
      // z = cd * sin(dec)
      // t = 0
      expect(pos.getT()).toBe(0)
      expect(pos.getX()).not.toBeNaN()
      expect(pos.getY()).not.toBeNaN()
      expect(pos.getZ()).not.toBeNaN()
    })

    it('should compute correctly for Closed space (Kappa > 0) in Reference Space (!comovingSpaceFlag)', () => {
      const { kappa, lambda, omega, alpha } = closedParams
      const pos = projection.computePos(false, angDist, ra, dec, z, kappa, lambda, omega, alpha, false)

      // For closed space ref frame:
      // x = sin(angDist) * ...
      // t = cos(angDist)
      expect(pos.getT()).toBeCloseTo(Math.cos(angDist), 5)

      // Magnitude of spatial part should be sin(angDist)
      const r = Math.sqrt(pos.getX()**2 + pos.getY()**2 + pos.getZ()**2)
      expect(r).toBeCloseTo(Math.sin(angDist), 5)
    })

    it('should compute correctly for Open space (Kappa < 0) in Reference Space (!comovingSpaceFlag)', () => {
      const { kappa, lambda, omega, alpha } = openParams
      const pos = projection.computePos(false, angDist, ra, dec, z, kappa, lambda, omega, alpha, false)

      // For open space ref frame:
      // t = cosh(angDist)
      expect(pos.getT()).toBeCloseTo(Math.cosh(angDist), 5)

      // Magnitude of spatial part should be sinh(angDist)
      const r = Math.sqrt(pos.getX()**2 + pos.getY()**2 + pos.getZ()**2)
      expect(r).toBeCloseTo(Math.sinh(angDist), 5)
    })

    it('should compute correctly for Comoving Space (comovingSpaceFlag=true)', () => {
       // With comovingSpaceFlag=true, the logic scales by 1/sqrt(|kappa|) and shifts T
       const { kappa, lambda, omega, alpha } = closedParams
       const pos = projection.computePos(true, angDist, ra, dec, z, kappa, lambda, omega, alpha, false)

       // t = (1/sqrt(k)) * (cos(angDist) - 1.0)
       const s = 1.0 / Math.sqrt(kappa)
       expect(pos.getT()).toBeCloseTo(s * (Math.cos(angDist) - 1.0), 5)
    })
  })

  describe('calcProjVects', () => {
    it('should return 4 orthogonal vectors E0, E1, E2, E3', () => {
      const RA1 = 0
      const Dec1 = 0
      const Beta = 0

      const { E0, E1, E2, E3 } = projection.calcProjVects(RA1, Dec1, Beta)

      expect(E0).toBeInstanceOf(Vect4d)
      expect(E1).toBeInstanceOf(Vect4d)
      expect(E2).toBeInstanceOf(Vect4d)
      expect(E3).toBeInstanceOf(Vect4d)

      expect(E0.getX()).toBe(0)
      expect(E0.getY()).toBe(0)
      expect(E0.getZ()).toBe(0)
      expect(E0.getT()).toBe(1)

      // Check orthogonality (dot products should be 0)
      expect(E1.dotProd4d(E2)).toBeCloseTo(0, 5)
      expect(E1.dotProd4d(E3)).toBeCloseTo(0, 5)
      expect(E2.dotProd4d(E3)).toBeCloseTo(0, 5)
    })
  })

  describe('computeProj', () => {
    // Create a dummy position 4-vector
    const pos = { x: 1, y: 2, z: 3, t: 4 }
    // Dummy basis vectors
    const E0 = new Vect4d(0, 0, 0, 1) // T axis
    const E1 = new Vect4d(1, 0, 0, 0) // X axis
    const E2 = new Vect4d(0, 1, 0, 0) // Y axis
    const E3 = new Vect4d(0, 0, 1, 0) // Z axis

    it('should project correctly for View 1 (E0, E1)', () => {
       // View 1 uses E0 (x) and E1 (y)
       // x = p.E0 = 1*0 + 2*0 + 3*0 + 4*1 = 4
       // y = p.E1 = 1*1 + ... = 1
       const { x, y } = projection.computeProj(pos, 1, E0, E1, E2, E3)
       expect(x).toBe(4)
       expect(y).toBe(1)
    })

    it('should project correctly for View 4 (E1, E2) - Standard Front View', () => {
       // View 4 uses E1 (x) and E2 (y)
       // x = p.E1 = 1
       // y = p.E2 = 2
       const { x, y } = projection.computeProj(pos, 4, E0, E1, E2, E3)
       expect(x).toBe(1)
       expect(y).toBe(2)
    })

    it('should default to View 1 for unknown view code', () => {
        const { x, y } = projection.computeProj(pos, 99, E0, E1, E2, E3)
        expect(x).toBe(4) // E0
        expect(y).toBe(1) // E1
    })
  })
})
