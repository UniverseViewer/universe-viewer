/**
 * Load catalog from file, parsing it to Target objects.
 */

import Target from '@/logic/target.js'

/*
 * Load catalog from custom ADR format.
 * Expected format per line: Ascension Declination Redshift
 * @param {string} content - The raw file content
 * @returns {Array} Array of Target objects
 */
export function loadCatalogADR(content) {
  const lines = content.split(/\r?\n/)
  const targets = []

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

    const t = new Target()
    t.setAscension(asc)
    t.setDeclination(dec)
    t.setRedshift(redshift)

    targets.push(t)
  }

  return targets
}
