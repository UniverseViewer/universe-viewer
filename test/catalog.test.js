import { setActivePinia, createPinia } from 'pinia'
import { useCatalogStore } from '@/stores/catalog.js'
import { describe, it, expect, beforeEach } from 'vitest'

describe('Catalog Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should load all targets when percent is 100', () => {
    const store = useCatalogStore()
    const content = `1 1 1\n2 2 2\n3 3 3\n4 4 4`
    store.load(content, 100)
    expect(store.targets.length).toBe(4)
  })

  it('should load subset of targets when percent is 50', () => {
    const store = useCatalogStore()
    const content = `1 1 1\n2 2 2\n3 3 3\n4 4 4`
    store.load(content, 50)
    // with 4 items, 50% is 2 items
    expect(store.targets.length).toBe(2)
  })
})

describe('Catalog Store Distribution', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should calculate redshift distribution correctly', () => {
    const store = useCatalogStore()
    // 3 items. min=1, max=3.
    // resolution=2. step = (3-1)/2 = 1.
    // bin 0: [1, 2)
    // bin 1: [2, 3]
    const content = `1 1 1.0\n2 2 2.5\n3 3 3.0`
    store.load(content, 100)
    store.resolution = 2

    expect(store.minRedshift).toBe(1.0)
    expect(store.maxRedshift).toBe(3.0)

    const dist = store.redshiftDistribution
    expect(dist.length).toBe(2)

    // 1.0 -> bin 0
    // 2.5 -> bin 1
    // 3.0 -> bin 1
    expect(dist[0]).toBe(1)
    expect(dist[1]).toBe(2)
  })

  it('should handle resolution change', () => {
    const store = useCatalogStore()
    const content = `1 1 1.0\n2 2 2.0\n3 3 3.0`
    store.load(content, 100)
    store.resolution = 3
    // min=1, max=3. step=2/3 = 0.666
    // bin 0: [1, 1.66)
    // bin 1: [1.66, 2.33)
    // bin 2: [2.33, 3.0]
    //
    const dist = store.redshiftDistribution
    expect(dist.length).toBe(3)
    expect(dist[0]).toBe(1)
    expect(dist[1]).toBe(1)
    expect(dist[2]).toBe(1)
  })
})
