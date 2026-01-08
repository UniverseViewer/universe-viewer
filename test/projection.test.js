import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as projection from '@/logic/projection.js'
import Vect4d from '@/logic/vect4d.js'

// Define spies using vi.hoisted so they can be used in mocking and test bodies
const mocks = vi.hoisted(() => {
  return {
    statusStore: {
      computationStart: vi.fn(),
      computationEnd: vi.fn(),
      setStatusMessage: vi.fn(),
      setProgress: vi.fn(),
      projComputationStart: vi.fn(),
      projComputationEnd: vi.fn(),
    },
    catalogStore: {
      sharedBuffer: null,
    },
    workerPool: {
      getProjectionWorkerPool: vi.fn(),
    },
    console: {
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    },
  }
})

// Mock the store modules
vi.mock('@/stores/status.js', () => ({
  useStatusStore: () => mocks.statusStore,
}))

vi.mock('@/stores/catalog.js', () => ({
  useCatalogStore: () => mocks.catalogStore,
}))

vi.mock('@/logic/workerPool.js', () => ({
  getProjectionWorkerPool: mocks.workerPool.getProjectionWorkerPool,
}))

describe('Projection Logic', () => {
  // Common cosmological parameters for testing
  const flatParams = { kappa: 0, lambda: 0.7, omega: 0.3, alpha: 0 }
  const closedParams = { kappa: 0.2, lambda: 0, omega: 1.2, alpha: 0 }
  const openParams = { kappa: -0.8, lambda: 0, omega: 0.2, alpha: 0 }

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
    const angDist = 0.5
    const ra = Math.PI / 4
    const dec = Math.PI / 4
    const z = 1.0

    it('should return a Vect4d', () => {
      const pos = projection.computePos(false, angDist, ra, dec, z, 0, 0.7, 0.3, 0, false)
      expect(pos).toBeInstanceOf(Vect4d)
    })

    it('should compute correctly for Flat space (Kappa=0) in Reference Space (!comovingSpaceFlag)', () => {
      const { kappa, lambda, omega, alpha } = flatParams
      const pos = projection.computePos(
        false,
        angDist,
        ra,
        dec,
        z,
        kappa,
        lambda,
        omega,
        alpha,
        false,
      )
      expect(pos.getT()).toBe(0)
      expect(pos.getX()).not.toBeNaN()
    })

    it('should compute correctly for Closed space (Kappa > 0) in Reference Space (!comovingSpaceFlag)', () => {
      const { kappa, lambda, omega, alpha } = closedParams
      const pos = projection.computePos(
        false,
        angDist,
        ra,
        dec,
        z,
        kappa,
        lambda,
        omega,
        alpha,
        false,
      )
      expect(pos.getT()).toBeCloseTo(Math.cos(angDist), 5)
      const r = Math.sqrt(pos.getX() ** 2 + pos.getY() ** 2 + pos.getZ() ** 2)
      expect(r).toBeCloseTo(Math.sin(angDist), 5)
    })

    it('should compute correctly for Open space (Kappa < 0) in Reference Space (!comovingSpaceFlag)', () => {
      const { kappa, lambda, omega, alpha } = openParams
      const pos = projection.computePos(
        false,
        angDist,
        ra,
        dec,
        z,
        kappa,
        lambda,
        omega,
        alpha,
        false,
      )
      expect(pos.getT()).toBeCloseTo(Math.cosh(angDist), 5)
      const r = Math.sqrt(pos.getX() ** 2 + pos.getY() ** 2 + pos.getZ() ** 2)
      expect(r).toBeCloseTo(Math.sinh(angDist), 5)
    })

    it('should compute correctly for Comoving Space (comovingSpaceFlag=true)', () => {
      const { kappa, lambda, omega, alpha } = closedParams
      const pos = projection.computePos(
        true,
        angDist,
        ra,
        dec,
        z,
        kappa,
        lambda,
        omega,
        alpha,
        false,
      )
      const s = 1.0 / Math.sqrt(kappa)
      expect(pos.getT()).toBeCloseTo(s * (Math.cos(angDist) - 1.0), 5)
    })
  })

  describe('calcProjVects', () => {
    it('should return 4 orthogonal vectors E0, E1, E2, E3', () => {
      const { E0, E1, E2 } = projection.calcProjVects(0, 0, 0)
      expect(E0).toBeInstanceOf(Vect4d)
      expect(E0.getT()).toBe(1)
      expect(E1.dotProd4d(E2)).toBeCloseTo(0, 5)
    })
  })

  describe('computeProj', () => {
    const pos = { x: 1, y: 2, z: 3, t: 4 }
    const E0 = new Vect4d(0, 0, 0, 1)
    const E1 = new Vect4d(1, 0, 0, 0)
    const E2 = new Vect4d(0, 1, 0, 0)
    const E3 = new Vect4d(0, 0, 1, 0)

    it('should project correctly for View 1 (E0, E1)', () => {
      const { x, y } = projection.computeProj(pos, 1, E0, E1, E2, E3)
      expect(x).toBe(4)
      expect(y).toBe(1)
    })

    it('should project correctly for View 4 (E1, E2)', () => {
      const { x, y } = projection.computeProj(pos, 4, E0, E1, E2, E3)
      expect(x).toBe(1)
      expect(y).toBe(2)
    })

    it('should default to View 1 for unknown view code', () => {
      const { x, y } = projection.computeProj(pos, 99, E0, E1, E2, E3)
      expect(x).toBe(4)
      expect(y).toBe(1)
    })
  })

  describe('comovingDist', () => {
    it('should use trapezoidal integration when precisionEnabled is true', () => {
      const dist = projection.comovingDist(1.0, 0, 0.7, 0.3, 0, true)
      expect(dist).toBeGreaterThan(0)
    })
  })

  describe('computePos additional branches', () => {
    const angDist = 0.5
    const ra = 0
    const dec = 0
    const z = 1.0

    it('should compute correctly for Comoving Space (kappa < 0)', () => {
      const { kappa, lambda, omega, alpha } = openParams
      const pos = projection.computePos(
        true,
        angDist,
        ra,
        dec,
        z,
        kappa,
        lambda,
        omega,
        alpha,
        false,
      )
      const s = 1.0 / Math.sqrt(-kappa)
      expect(pos.getT()).toBeCloseTo(s * (Math.cosh(angDist) - 1.0), 5)
    })

    it('should compute correctly for Comoving Space (kappa = 0)', () => {
      const { kappa, lambda, omega, alpha } = flatParams
      const pos = projection.computePos(
        true,
        angDist,
        ra,
        dec,
        z,
        kappa,
        lambda,
        omega,
        alpha,
        false,
      )
      expect(pos.getT()).toBe(0)
    })
  })

  describe('computeProj additional views', () => {
    const pos = { x: 1, y: 2, z: 3, t: 4 }
    const E0 = new Vect4d(0, 0, 0, 1) // T
    const E1 = new Vect4d(1, 0, 0, 0) // X
    const E2 = new Vect4d(0, 1, 0, 0) // Y
    const E3 = new Vect4d(0, 0, 1, 0) // Z

    it('should project correctly for View 2 (E0, E2)', () => {
      const { x, y } = projection.computeProj(pos, 2, E0, E1, E2, E3)
      expect(x).toBe(4)
      expect(y).toBe(2)
    })

    it('should project correctly for View 3 (E0, E3)', () => {
      const { x, y } = projection.computeProj(pos, 3, E0, E1, E2, E3)
      expect(x).toBe(4)
      expect(y).toBe(3)
    })

    it('should project correctly for View 5 (E1, E3)', () => {
      const { x, y } = projection.computeProj(pos, 5, E0, E1, E2, E3)
      expect(x).toBe(1)
      expect(y).toBe(3)
    })

    it('should project correctly for View 6 (E2, E3)', () => {
      const { x, y } = projection.computeProj(pos, 6, E0, E1, E2, E3)
      expect(x).toBe(2)
      expect(y).toBe(3)
    })
  })

  describe('calcProjVects additional branch', () => {
    it('should handle case where P1.x >= 0.9', () => {
      const RA1 = 0
      const Dec1 = 0
      const Beta = 0
      const { E1 } = projection.calcProjVects(RA1, Dec1, Beta)
      expect(E1.getX()).toBeCloseTo(1, 5)
    })

    it('should handle case where P1.x < 0.9', () => {
      const RA1 = Math.PI / 2
      const Dec1 = 0
      const Beta = 0
      const { E1 } = projection.calcProjVects(RA1, Dec1, Beta)
      expect(E1.getX()).toBeCloseTo(0, 5)
      expect(E1.getY()).toBeCloseTo(1, 5)
    })
  })

  describe('Array Processing Functions (Synchronous)', () => {
    const createMockTarget = () => ({
      redshift: 1.0,
      angularDistance: 0,
      ascension: 0,
      declination: 0,
      pos: new Vect4d(1, 0, 0, 0),
      x: 0,
      y: 0,
      getRedshift: function () {
        return this.redshift
      },
      getAngularDist: function () {
        return this.angularDistance
      },
      setAngularDist: function (v) {
        this.angularDistance = v
      },
      getAscension: function () {
        return this.ascension
      },
      getDeclination: function () {
        return this.declination
      },
      setPos: function (v) {
        this.pos = v
      },
      getPos: function () {
        return this.pos
      },
      setx: function (v) {
        this.x = v
      },
      sety: function (v) {
        this.y = v
      },
    })

    it('calcTargetsAngularDist should process all targets', () => {
      const targets = [createMockTarget(), createMockTarget()]
      const res = projection.calcTargetsAngularDist(targets, 0, 0.7, 0.3, 0, false)
      expect(res).toBe(true)
      expect(targets[0].angularDistance).toBeGreaterThan(0)
    })

    it('calcTargetsAngularDist should return false if !targets', () => {
      expect(projection.calcTargetsAngularDist(null)).toBe(false)
    })

    it('calcTargetsPos should process all targets', () => {
      const targets = [createMockTarget()]
      targets[0].angularDistance = 1.0
      const res = projection.calcTargetsPos(targets, false, 0, 0.7, 0.3, 0, false)
      expect(res).toBe(true)
      expect(targets[0].pos).not.toBeNull()
    })

    it('calcTargetsPos should return false if !targets', () => {
      expect(projection.calcTargetsPos(null)).toBe(false)
    })

    it('calcTargetsProj should process all targets', () => {
      const targets = [createMockTarget()]
      projection.calcTargetsProj(targets, 4, 0, 0, 0)
      expect(targets[0].x).toBeCloseTo(1, 4)
    })

    it('calcTargetsProj should return if !targets', () => {
      expect(projection.calcTargetsProj(null)).toBeUndefined()
    })
  })

  describe('Parallel Computation Logic', () => {
    // Helper to reset mocks
    function resetMocks() {
      mocks.workerPool.getProjectionWorkerPool.mockReset()
      mocks.statusStore.setStatusMessage.mockReset()
      mocks.statusStore.computationStart.mockReset()
      mocks.statusStore.computationEnd.mockReset()
      mocks.statusStore.setProgress.mockReset()
      mocks.statusStore.projComputationStart.mockReset()
      mocks.statusStore.projComputationEnd.mockReset()
      mocks.catalogStore.sharedBuffer = null

      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue({
        getWorkerCount: () => 2,
        executeParallel: vi.fn().mockResolvedValue(true),
      })
    }

    beforeAll(() => {
      resetMocks()
    })

    const createMockTarget = () => ({
      redshift: 0.5,
      angularDistance: 0.5,
      ascension: 0,
      declination: 0,
      pos: new Vect4d(1, 0, 0, 0),
      x: 0,
      y: 0,
      getRedshift: function () {
        return this.redshift
      },
      getAngularDist: function () {
        return this.angularDistance
      },
      setAngularDist: function (v) {
        this.angularDistance = v
      },
      getAscension: function () {
        return this.ascension
      },
      getDeclination: function () {
        return this.declination
      },
      setPos: function (v) {
        this.pos = v
      },
      getPos: function () {
        return this.pos
      },
      setx: function (v) {
        this.x = v
      },
      sety: function (v) {
        this.y = v
      },
    })

    it('calcTargetsAngularDistParallel should execute tasks via pool', async () => {
      resetMocks()
      const mockPool = { getWorkerCount: () => 2, executeParallel: vi.fn().mockResolvedValue(true) }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const targets = [createMockTarget(), createMockTarget()]
      await projection.calcTargetsAngularDistParallel(targets, 0, 0.7, 0.3, 0, false)

      expect(mocks.workerPool.getProjectionWorkerPool).toHaveBeenCalled()
      expect(mockPool.executeParallel).toHaveBeenCalled()
    })

    it('calcTargetsAngularDistParallel should handle failures gracefully (fallback)', async () => {
      resetMocks()
      const mockPool = {
        getWorkerCount: () => 2,
        executeParallel: vi.fn().mockRejectedValueOnce(new Error('Worker failed')),
      }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const targets = [createMockTarget()]
      const res = await projection.calcTargetsAngularDistParallel(targets, 0, 0.7, 0.3, 0, false)
      expect(res).toBe(true)
      expect(targets[0].angularDistance).toBeGreaterThan(0)
    })

    it('calcTargetsPosParallel should execute tasks via pool', async () => {
      resetMocks()
      const mockPool = { getWorkerCount: () => 2, executeParallel: vi.fn().mockResolvedValue(true) }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const targets = [createMockTarget()]
      await projection.calcTargetsPosParallel(targets, false, 0, 0.7, 0.3, 0, false)
      expect(mockPool.executeParallel).toHaveBeenCalled()
    })

    it('calcTargetsPosParallel should handle failures', async () => {
      resetMocks()
      const mockPool = {
        getWorkerCount: () => 2,
        executeParallel: vi.fn().mockRejectedValueOnce(new Error('Fail')),
      }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const targets = [createMockTarget()]
      const res = await projection.calcTargetsPosParallel(targets, false, 0, 0.7, 0.3, 0, false)
      expect(res).toBe(true)
      expect(targets[0].pos).toBeInstanceOf(Vect4d)
    })

    it('calcTargetsProjParallel should execute tasks via pool', async () => {
      resetMocks()
      const mockPool = { getWorkerCount: () => 2, executeParallel: vi.fn().mockResolvedValue(true) }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const targets = [createMockTarget()]
      await projection.calcTargetsProjParallel(targets, 4, 0, 0, 0)
      expect(mockPool.executeParallel).toHaveBeenCalled()
    })

    it('calcTargetsProjParallel should handle failures', async () => {
      resetMocks()
      const mockPool = {
        getWorkerCount: () => 2,
        executeParallel: vi.fn().mockRejectedValueOnce(new Error('Fail')),
      }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const targets = [createMockTarget()]
      await projection.calcTargetsProjParallel(targets, 4, 0, 0, 0)
      expect(targets[0].x).toBeDefined()
    })

    it('updateAll should use parallel path if threshold exceeded', async () => {
      resetMocks()
      const mockPool = { getWorkerCount: () => 2, executeParallel: vi.fn().mockResolvedValue(true) }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const minimalTarget = {
        redshift: 0,
        angularDistance: 0,
        ascension: 0,
        declination: 0,
        pos: { x: 0, y: 0, z: 0, t: 0 },
        setAngularDist: () => {},
        setPos: () => {},
        getPos: () => {
          return { x: 0, y: 0, z: 0, t: 0 }
        },
        setx: () => {},
        sety: () => {},
        getRedshift: () => 0,
        getAngularDist: () => 0,
        getAscension: () => 0,
        getDeclination: () => 0,
      }
      const lotsOfTargets = new Array(300001).fill(minimalTarget)
      mocks.catalogStore.targets = lotsOfTargets

      await projection.updateAll(lotsOfTargets, 4, 0, 0, 0, false, 0, 0.7, 0.3, 0, false)

    // Verify status updates
    expect(mocks.statusStore.computationStart).toHaveBeenCalled()
    expect(mocks.statusStore.setStatusMessage).toHaveBeenCalledWith('Computing angular distances [1/3]')
    expect(mocks.statusStore.computationEnd).toHaveBeenCalled()
  })

    it('should return early if targets array is empty', async () => {
      resetMocks()
      expect(await projection.calcTargetsAngularDistParallel([], 0, 0.7, 0.3, 0, false)).toBe(false)
      expect(await projection.calcTargetsPosParallel([], false, 0, 0.7, 0.3, 0, false)).toBe(false)
      await projection.calcTargetsProjParallel([], 4, 0, 0, 0)
      // calcTargetsProjParallel returns undefined (void), so just ensure it doesn't crash/call pool
      expect(mocks.workerPool.getProjectionWorkerPool).not.toHaveBeenCalled()
    })

    it('should reuse shared buffer if provided', async () => {
      resetMocks()
      const mockPool = {
        getWorkerCount: () => 2,
        executeParallel: vi.fn().mockResolvedValue(true),
      }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const targets = [createMockTarget()]
      // Mock a shared buffer
      const buffer = new SharedArrayBuffer(1024)

      // Pass buffer explicitly to verify the branch where buffer is provided
      await projection.calcTargetsAngularDistParallel(targets, 0, 0.7, 0.3, 0, false, buffer)
      expect(mocks.statusStore.setProgress).not.toHaveBeenCalled() // No progress if manual call? Actually it does set progress.

      // We mainly care that it runs without error and uses the buffer logic
      expect(mockPool.executeParallel).toHaveBeenCalled()
      const callArgs = mockPool.executeParallel.mock.calls[0][0]
      expect(callArgs[0].data.buffer).toBe(buffer)

      // Also test updateAll with stored buffer
      resetMocks()
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)
      mocks.catalogStore.sharedBuffer = buffer

      const lotsOfTargets = new Array(300001).fill(createMockTarget())
      mocks.catalogStore.targets = lotsOfTargets
      await projection.updateAll(lotsOfTargets, 4, 0, 0, 0, false, 0, 0.7, 0.3, 0, false)

      // Verify that the buffer from store was passed down
      expect(mockPool.executeParallel).toHaveBeenCalled()
      // Check the last call (calcTargetsProjParallel) or any
      // updateAll calls: AngDist, Pos, Proj.
      // AngDist is first.
      const firstCallArgs = mockPool.executeParallel.mock.calls[0][0]
      expect(firstCallArgs[0].data.buffer).toBe(buffer)
    })

    it('should handle null/undefined targets gracefully in updateAll/updateView', async () => {
      resetMocks()
      await projection.updateAll(null, 4, 0, 0, 0, false, 0, 0.7, 0.3, 0, false)
      expect(mocks.statusStore.setStatusMessage).toHaveBeenCalledWith('Computing (single-threaded)')

      resetMocks()
      await projection.updateView(undefined, 4, 0, 0, 0)
      expect(mocks.statusStore.setStatusMessage).toHaveBeenCalledWith('Computing (single-threaded)')
    })

    it('updateAll should fall back to sync if parallel fails', async () => {
      resetMocks()
      const minimalTarget = {
        redshift: 0,
        angularDistance: 0,
        ascension: 0,
        declination: 0,
        pos: { x: 0, y: 0, z: 0, t: 0 },
        setAngularDist: () => {},
        setPos: () => {},
        getPos: () => {
          return { x: 0, y: 0, z: 0, t: 0 }
        },
        setx: () => {},
        sety: () => {},
        getRedshift: () => 0,
        getAngularDist: () => 0,
        getAscension: () => 0,
        getDeclination: () => 0,
      }
      const lotsOfTargets = new Array(300001).fill(minimalTarget)
      mocks.catalogStore.targets = lotsOfTargets

      // Mock setStatusMessage to throw on the first call to trigger the catch block in updateAll
      mocks.statusStore.setStatusMessage.mockImplementationOnce(() => {
        throw new Error('Simulated Failure')
      })

      await projection.updateAll(lotsOfTargets, 4, 0, 0, 0, false, 0, 0.7, 0.3, 0, false)

      expect(mocks.statusStore.setStatusMessage).toHaveBeenCalledWith('Computing (single-threaded)')
    }, 15000)

    it('updateView should use parallel path if threshold exceeded', async () => {
      resetMocks()
      const mockPool = { getWorkerCount: () => 2, executeParallel: vi.fn().mockResolvedValue(true) }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const minimalTarget = {
        pos: { x: 0, y: 0, z: 0, t: 0 },
        getPos: () => {
          return { x: 0, y: 0, z: 0, t: 0 }
        },
        setx: () => {},
        sety: () => {},
      }
      const lotsOfTargets = new Array(300001).fill(minimalTarget)
      mocks.catalogStore.targets = lotsOfTargets

      await projection.updateView(lotsOfTargets, 4, 0, 0, 0)
      expect(mocks.statusStore.setStatusMessage).toHaveBeenCalledWith('Computing projection')
    })

    it('updateView should fall back to sync if parallel fails', async () => {
      resetMocks()
      const minimalTarget = {
        pos: { x: 0, y: 0, z: 0, t: 0 },
        getPos: () => {
          return { x: 0, y: 0, z: 0, t: 0 }
        },
        setx: () => {},
        sety: () => {},
      }
      const lotsOfTargets = new Array(300001).fill(minimalTarget)
      mocks.catalogStore.targets = lotsOfTargets

      // Mock setStatusMessage to throw on the first call to trigger the catch block in updateView
      // The first call is 'Computing projection'
      mocks.statusStore.setStatusMessage.mockImplementationOnce(() => {
        throw new Error('Simulated Failure')
      })

      // We need executeParallel to be mocked to succeed (because we want it to reach the throw point or just pass it)
      const mockPool = {
        getWorkerCount: () => 2,
        executeParallel: vi.fn().mockResolvedValue(true),
      }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      await projection.updateView(lotsOfTargets, 4, 0, 0, 0)

      expect(mocks.statusStore.setStatusMessage).toHaveBeenCalledWith('Computing (single-threaded)')
    }, 15000)

    it('should update progress during parallel execution', async () => {
      resetMocks()
      // Custom mock to trigger onProgress
      const mockPool = {
        getWorkerCount: () => 2,
        executeParallel: vi.fn().mockImplementation(async (tasks) => {
          // Simulate progress
          tasks.forEach((task) => {
            if (task.onProgress) task.onProgress(0.5)
          })
          return true
        }),
      }
      mocks.workerPool.getProjectionWorkerPool.mockResolvedValue(mockPool)

      const targets = [createMockTarget()]

      await projection.calcTargetsAngularDistParallel(targets, 0, 0.7, 0.3, 0, false)
      expect(mocks.statusStore.setProgress).toHaveBeenCalled()

      mocks.statusStore.setProgress.mockClear()
      await projection.calcTargetsPosParallel(targets, false, 0, 0.7, 0.3, 0, false)
      expect(mocks.statusStore.setProgress).toHaveBeenCalled()

      mocks.statusStore.setProgress.mockClear()
      await projection.calcTargetsProjParallel(targets, 4, 0, 0, 0)
      expect(mocks.statusStore.setProgress).toHaveBeenCalled()
    })
  })
})
