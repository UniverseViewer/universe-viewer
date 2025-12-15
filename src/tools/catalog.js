/*
 * Copyright (C) 2008-2025 Mathieu Abati <mathieu.abati@gmail.com>
 * Copyright (C) 2008 Julie Fontaine
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 */

/**
 * Load catalog from file, parsing it to Target objects.
 */

import Target, { STRIDE, OFFSET_REDSHIFT, OFFSET_RA, OFFSET_DEC } from '@/logic/target.js'
import { useTargetsStore } from '@/stores/targets.js'

/*
 * Load catalog from custom ADR format.
 * If SharedArrayBuffer is supported, targets are loaded in a such buffer, else they are loaded as regular objects.
 * Expected format per line: Ascension Declination Redshift
 * @param {string} content - The raw file content
 * @param {number} percent - Subset percentage to load
 * @returns {Array} Array of Target objects
 */
export function loadCatalogADR(content, percent = 100) {
  const lines = content.split(/\r?\n/)
  const targets = []

  if (percent < 1) percent = 1
  else if (percent > 100) percent = 100

  // Allocate Buffer (if supported)
  let buffer = null
  let float64View = null
  let useBuffer = false


  if (typeof SharedArrayBuffer === 'undefined') {
    let msg = 'SharedArrayBuffer is not available. Parallel computation will be disabled.'
    if (typeof self !== 'undefined') {
      if (!self.isSecureContext) {
        msg += ' Reason: Not in a Secure Context (HTTPS is required).'
      } else if (!self.crossOriginIsolated) {
        msg += ' Reason: Not Cross-Origin Isolated. Check COOP/COEP headers and ensure they are served over HTTPS.'
      }
    }
    console.warn(msg)
  } else {
    try {
      buffer = new SharedArrayBuffer(lines.length * STRIDE * Float64Array.BYTES_PER_ELEMENT)
      float64View = new Float64Array(buffer)
      useBuffer = true
      const targetsStore = useTargetsStore()
      targetsStore.setSharedBuffer(buffer)
      targetsStore.setBufferOutdated(false)
    } catch (e) {
      console.warn('Failed to create SharedArrayBuffer:', e)
    }
  }

  // Populate targets
  let currentIdx = 0
  for (let [processed, line] of lines.entries()) {
    if (!line) continue
    line = line.trim()
    const parts = line.split(/\s+/)
    if (parts.length < 3) continue

    if (!(currentIdx / processed < percent / 100)) {
      continue
    }

    const asc = parseFloat(parts[0])
    const dec = parseFloat(parts[1])
    const redshift = parseFloat(parts[2])

    if (isNaN(asc) || isNaN(dec) || isNaN(redshift)) continue

    if (useBuffer) {
      // Direct write to buffer
      const offset = currentIdx * STRIDE
      float64View[offset + OFFSET_RA] = asc
      float64View[offset + OFFSET_DEC] = dec
      float64View[offset + OFFSET_REDSHIFT] = redshift
      // Create lightweight Target view
      targets.push(new Target({ bufferView: float64View, index: currentIdx }))
    } else {
      // Fallback to object
      targets.push(new Target({ascension: asc, declination: dec, redshift }))
    }
    currentIdx++
  }

  return targets
}
