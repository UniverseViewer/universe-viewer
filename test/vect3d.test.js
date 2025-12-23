import { describe, it, expect } from 'vitest'
import Vect3d from '@/logic/vect3d.js'

describe('Vect3d', () => {
  it('should initialize with default values (0,0,0)', () => {
    const v = new Vect3d()
    expect(v.getX()).toBe(0)
    expect(v.getY()).toBe(0)
    expect(v.getZ()).toBe(0)
  })

  it('should initialize with provided values', () => {
    const v = new Vect3d(1, 2, 3)
    expect(v.getX()).toBe(1)
    expect(v.getY()).toBe(2)
    expect(v.getZ()).toBe(3)
  })

  it('should set values correctly', () => {
    const v = new Vect3d()
    v.setX(10)
    v.setY(20)
    v.setZ(30)
    expect(v.getX()).toBe(10)
    expect(v.getY()).toBe(20)
    expect(v.getZ()).toBe(30)
  })

  it('should calculate dot product correctly', () => {
    const v1 = new Vect3d(1, 2, 3)
    const v2 = new Vect3d(4, 5, 6)
    // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    expect(v1.dotProd3d(v2)).toBe(32)
  })

  it('should calculate cross product correctly', () => {
    const v1 = new Vect3d(1, 0, 0)
    const v2 = new Vect3d(0, 1, 0)
    const v3 = v1.vectProd3d(v2)
    // i x j = k => (0, 0, 1)
    expect(v3.getX()).toBe(0)
    expect(v3.getY()).toBe(0)
    expect(v3.getZ()).toBe(1)

    const v4 = new Vect3d(1, 2, 3)
    const v5 = new Vect3d(4, 5, 6)
    const res = v4.vectProd3d(v5)
    // x = 2*6 - 3*5 = 12 - 15 = -3
    // y = 3*4 - 1*6 = 12 - 6 = 6
    // z = 1*5 - 2*4 = 5 - 8 = -3
    expect(res.getX()).toBe(-3)
    expect(res.getY()).toBe(6)
    expect(res.getZ()).toBe(-3)
  })

  it('should calculate norm correctly', () => {
    const v = new Vect3d(3, 4, 0)
    // sqrt(9 + 16) = 5
    expect(v.norm()).toBe(5)
  })
})
