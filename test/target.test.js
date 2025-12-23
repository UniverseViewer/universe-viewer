import { describe, it, expect } from 'vitest'
import Target, {
  OFFSET_REDSHIFT,
  OFFSET_RA,
  OFFSET_DEC,
  OFFSET_ANG_DIST,
  OFFSET_POS_X,
  OFFSET_POS_Y,
  OFFSET_POS_Z,
  OFFSET_POS_T,
  OFFSET_PROJ_X,
  OFFSET_PROJ_Y,
  STRIDE
} from '@/logic/target.js'
import Vect4d from '@/logic/vect4d.js'

describe('Target', () => {

  describe('Constants', () => {
    it('should export correct offsets', () => {
      expect(OFFSET_REDSHIFT).toBe(0)
      expect(OFFSET_RA).toBe(1)
      expect(OFFSET_DEC).toBe(2)
      expect(OFFSET_ANG_DIST).toBe(3)
      expect(OFFSET_POS_X).toBe(4)
      expect(OFFSET_POS_Y).toBe(5)
      expect(OFFSET_POS_Z).toBe(6)
      expect(OFFSET_POS_T).toBe(7)
      expect(OFFSET_PROJ_X).toBe(8)
      expect(OFFSET_PROJ_Y).toBe(9)
      expect(STRIDE).toBe(10)
    })
  })

  describe('Object Mode (Standard JS Object)', () => {

    it('should initialize with default values', () => {
      const t = new Target()
      expect(t.getAscension()).toBe(0)
      expect(t.getDeclination()).toBe(0)
      expect(t.getRedshift()).toBe(0)
      expect(t.isBufferBacked).toBe(false)
    })

    it('should initialize with provided values', () => {
      const t = new Target({ ascension: 1.5, declination: -0.5, redshift: 2.0 })
      expect(t.getAscension()).toBe(1.5)
      expect(t.getDeclination()).toBe(-0.5)
      expect(t.getRedshift()).toBe(2.0)
    })

    it('should set and get basic properties (Object Mode)', () => {
      const t = new Target()

      t.setAscension(1.2)
      expect(t.getAscension()).toBe(1.2)

      t.setDeclination(-0.4)
      expect(t.getDeclination()).toBe(-0.4)

      t.setRedshift(3.1)
      expect(t.getRedshift()).toBe(3.1)

      t.setAngularDist(10.5)
      expect(t.getAngularDist()).toBe(10.5) // Covers getAngularDist for isBufferBacked=false
    })

    it('should set and get Position (Pos) (Object Mode)', () => {
      const t = new Target() // isBufferBacked = false
      const v = new Vect4d(1, 2, 3, 4)

      t.setPos(v)
      const retrieved = t.getPos()

      expect(retrieved).toBeInstanceOf(Vect4d)
      expect(retrieved.getX()).toBe(1)
      expect(retrieved.getY()).toBe(2)
      expect(retrieved.getZ()).toBe(3)
      expect(retrieved.getT()).toBe(4)
    })

    it('should set and get Projection coords (x, y) (Object Mode)', () => {
      const t = new Target()

      t.setx(100)
      t.sety(200)

      expect(t.getx()).toBe(100)
      expect(t.gety()).toBe(200)
    })

    it('should set and get Selection state (Object Mode)', () => {
      const t = new Target()
      expect(t.isSelected()).toBeUndefined() // Default undefined/false

      t.setSelected(true)
      expect(t.isSelected()).toBe(true)

      t.setSelected(false)
      expect(t.isSelected()).toBe(false)
    })
  })

  describe('Buffer Mode (SharedArrayBuffer)', () => {
    // Helper to create a backed target
    const createBackedTarget = (index = 0) => {
      const buffer = new SharedArrayBuffer(STRIDE * 5 * Float64Array.BYTES_PER_ELEMENT) // enough for 5 items
      const view = new Float64Array(buffer)
      return {
        target: new Target({ bufferView: view, index }),
        view
      }
    }

    it('should initialize correctly in buffer mode', () => {
      const { target } = createBackedTarget(0)
      expect(target.isBufferBacked).toBe(true)
      // Initial buffer is 0
      expect(target.getAscension()).toBe(0)
    })

    it('should read from specific index offset', () => {
      const index = 2
      const { target, view } = createBackedTarget(index)

      // Manually set data in buffer at index 2
      const offset = index * STRIDE
      view[offset + OFFSET_RA] = 3.14
      view[offset + OFFSET_REDSHIFT] = 1.0

      expect(target.getAscension()).toBe(3.14)
      expect(target.getRedshift()).toBe(1.0)
    })

    it('should write to buffer correctly via setters', () => {
      const index = 1
      const { target, view } = createBackedTarget(index)
      const offset = index * STRIDE

      target.setAscension(0.5)
      expect(target.getAscension()).toBe(0.5)

      target.setDeclination(-0.5)
      expect(target.getDeclination()).toBe(-0.5)

      target.setRedshift(2.5)
      expect(target.getRedshift()).toBe(2.5)

      target.setAngularDist(10.0)
      expect(target.getAngularDist()).toBe(10.0)

      target.setx(50)
      expect(target.getx()).toBe(50)

      target.sety(60)
      expect(target.gety()).toBe(60)

      expect(view[offset + OFFSET_RA]).toBe(0.5)
      expect(view[offset + OFFSET_DEC]).toBe(-0.5)
      expect(view[offset + OFFSET_REDSHIFT]).toBe(2.5)
      expect(view[offset + OFFSET_ANG_DIST]).toBe(10.0)
      expect(view[offset + OFFSET_PROJ_X]).toBe(50)
      expect(view[offset + OFFSET_PROJ_Y]).toBe(60)
    })

    it('should handle Position (Pos) as structured object from buffer', () => {
      const index = 0
      const { target, view } = createBackedTarget(index)

      // Set pos via object-like structure (or Vect4d)
      const v = new Vect4d(10, 20, 30, 40)
      target.setPos(v)

      // Check buffer
      expect(view[OFFSET_POS_X]).toBe(10)
      expect(view[OFFSET_POS_Y]).toBe(20)
      expect(view[OFFSET_POS_Z]).toBe(30)
      expect(view[OFFSET_POS_T]).toBe(40)

      // Get pos back
      const pos = target.getPos()
      // In buffer mode, getPos returns a plain object with getters
      expect(pos.x).toBe(10)
      expect(pos.y).toBe(20)
      expect(pos.z).toBe(30)
      expect(pos.t).toBe(40)

      // Exercise all internal getters from the returned object
      expect(pos.getX()).toBe(10)
      expect(pos.getY()).toBe(20)
      expect(pos.getZ()).toBe(30)
      expect(pos.getT()).toBe(40)
    })

    it('should setPos accepting plain object with properties', () => {
       const { target, view } = createBackedTarget(0)
       target.setPos({ x: 1, y: 2, z: 3, t: 4 })
       expect(view[OFFSET_POS_X]).toBe(1)
       expect(view[OFFSET_POS_Y]).toBe(2)
       expect(view[OFFSET_POS_Z]).toBe(3)
       expect(view[OFFSET_POS_T]).toBe(4)
    })

    it('should setPos using object with getters (and no direct properties)', () => {
       const { target, view } = createBackedTarget(0)
       const mockVec = {
         getX: () => 10,
         getY: () => 20,
         getZ: () => 30,
         getT: () => 40
       }
       target.setPos(mockVec)

       expect(view[OFFSET_POS_X]).toBe(10)
       expect(view[OFFSET_POS_Y]).toBe(20)
       expect(view[OFFSET_POS_Z]).toBe(30)
       expect(view[OFFSET_POS_T]).toBe(40)
    })

    it('should setPos using object with getters where properties are 0 (falsy)', () => {
       const { target, view } = createBackedTarget(0)
       const mockVec = {
         x: 0, getX: () => 10,
         y: 0, getY: () => 20,
         z: 0, getZ: () => 30,
         t: 0, getT: () => 40
       }
       target.setPos(mockVec)

       expect(view[OFFSET_POS_X]).toBe(10)
       expect(view[OFFSET_POS_Y]).toBe(20)
       expect(view[OFFSET_POS_Z]).toBe(30)
       expect(view[OFFSET_POS_T]).toBe(40)
    })

    it('should handle selection state (not backed by buffer)', () => {
      const { target } = createBackedTarget(0)

      target.setSelected(true)
      expect(target.isSelected()).toBe(true)
    })
  })
})
