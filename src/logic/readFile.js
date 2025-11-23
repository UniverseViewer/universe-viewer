/**
 * Reads a text content (from file) and parses it into Quasar objects.
 * Expected format per line: Ascension Declination Redshift
 * @param {string} content - The raw file content
 */

import Quasar from './quasar.js'
import { useUniverseStore } from '@/stores/universe.js'

export function readTxtFileContent(content) {
  const store = useUniverseStore()

  const lines = content.split(/\r?\n/)
  const quasars = []
  let maxAsc = 0

  for (let line of lines) {
    line = line.trim()
    if (!line) continue

    // Split by whitespace
    const parts = line.split(/\s+/)
    if (parts.length < 3) {
      console.warn('Skipping line (not enough parts):', line)
      continue
    }

    const asc = parseFloat(parts[0])
    const dec = parseFloat(parts[1])
    const redshift = parseFloat(parts[2])

    if (isNaN(asc) || isNaN(dec) || isNaN(redshift)) {
      console.warn('Skipping line (NaN):', line)
      continue
    }

    const q = new Quasar()
    q.setAscension(asc)
    q.setDeclination(dec)
    q.setRedshift(redshift)

    if (asc > maxAsc) {
      maxAsc = asc
    }

    quasars.push(q)
  }



  // Update Store
  store.setQuasars(quasars)
  store.setAscensionMax(maxAsc)

  // Reset selection count
  store.setSelectedCount(0)

  return quasars.length
}
