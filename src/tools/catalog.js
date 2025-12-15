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

import Target from '@/logic/target.js'

/*
 * Load catalog from custom ADR format.
 * Expected format per line: Ascension Declination Redshift
 * @param {string} content - The raw file content
 * @param {number} percent - Subset percentage to load
 * @returns {Array} Array of Target objects
 */
export function loadCatalogADR(content, percent=100) {
  const lines = content.split(/\r?\n/)
  const targets = []
  let selected = 0;

  if (percent < 1) percent = 1
  else if (percent > 100) percent = 100

  for (let [processed, line] of lines.entries()) {
    if (!line) continue
    line = line.trim()

    // Split by whitespace
    const parts = line.split(/\s+/)
    if (parts.length < 3) {
      console.warn('Skipping line (not enough parts):', line)
      continue
    }

    if (!(targets.length / processed < percent / 100)) {
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
