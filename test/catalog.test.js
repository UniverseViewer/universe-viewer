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

