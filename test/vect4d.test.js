import { describe, it, expect } from 'vitest'
import Vect4d from '@/logic/vect4d.js'

describe('Vect4d', () => {
  it('should initialize with default values (0,0,0,0)', () => {
    const v = new Vect4d()
    expect(v.getX()).toBe(0)
    expect(v.getY()).toBe(0)
    expect(v.getZ()).toBe(0)
    expect(v.getT()).toBe(0)
  })

  it('should initialize with provided values', () => {
    const v = new Vect4d(1, 2, 3, 4)
    expect(v.getX()).toBe(1)
    expect(v.getY()).toBe(2)
    expect(v.getZ()).toBe(3)
    expect(v.getT()).toBe(4)
  })

  it('should set values correctly', () => {
    const v = new Vect4d()
    v.setX(10)
    v.setY(20)
    v.setZ(30)
    v.setT(40)
    expect(v.getX()).toBe(10)
    expect(v.getY()).toBe(20)
    expect(v.getZ()).toBe(30)
    expect(v.getT()).toBe(40)
  })

  it('should calculate dot product correctly', () => {
    const v1 = new Vect4d(1, 2, 3, 4)
    const v2 = new Vect4d(5, 6, 7, 8)
    // 1*5 + 2*6 + 3*7 + 4*8
    // = 5 + 12 + 21 + 32
    // = 70
    expect(v1.dotProd4d(v2)).toBe(70)
  })
})
