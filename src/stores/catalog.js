/*
 * Copyright (C) 2025-2026 Mathieu Abati <mathieu.abati@gmail.com>
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

import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import Target, { STRIDE, OFFSET_REDSHIFT, OFFSET_RA, OFFSET_DEC } from '@/logic/target.js'

export const useCatalogStore = defineStore('catalog', () => {
  const selectedTargets = shallowRef([])
  const targets = shallowRef(null)
  const subsetTargets = shallowRef(null)
  const sharedBuffer = shallowRef(null)
  const minRedshift = shallowRef(0.0)
  const maxRedshift = shallowRef(0.0)
  const resolution = shallowRef(10)

  // Computed from selectedTargets array length
  const selectedCount = computed(() => selectedTargets.value.length)

  function computeRedshiftDistribution(targets, min, max, resolution) {
    if (!targets || targets.length === 0) return []

    const dist = new Array(resolution).fill(0)

    if (max <= min) return dist

    const step = (max - min) / resolution

    const list = targets
    const len = list.length
    for (let i = 0; i < len; i++) {
      const r = list[i].getRedshift()
      let idx = Math.floor((r - min) / step)
      if (idx >= resolution) idx = resolution - 1
      if (idx < 0) idx = 0
      dist[idx]++
    }

    return dist
  }

  const redshiftDistribution = computed(() => {
    return computeRedshiftDistribution(targets.value, minRedshift.value, maxRedshift.value, resolution.value)
  })

  const selectionRedshiftDistribution = computed(() => {
    return computeRedshiftDistribution(selectedTargets.value, minRedshift.value, maxRedshift.value, resolution.value)
  })

  function setSelectedTargets(t) {
    selectedTargets.value = t
  }

  /*
   * Load catalog from custom ADR format.
   * If SharedArrayBuffer is supported, targets are loaded in a such buffer, else they are loaded as regular objects.
   * Expected format per line: Ascension Declination Redshift
   * @param {string} content - The raw file content
   * @param {number} percent - Subset percentage to load
   * @returns {Array} Array of Target objects
   */
  function load(content, percent = 100) {
    const lines = content.split(/\r?\n/)
    const newTargets = []
    let newMinRedshift = Number.MAX_VALUE
    let newMaxRedshift = 0

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
        sharedBuffer.value = buffer
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

      if (!(currentIdx / (processed + 1) < percent / 100)) {
        continue
      }

      const asc = parseFloat(parts[0])
      const dec = parseFloat(parts[1])
      const redshift = parseFloat(parts[2])
      if (redshift > newMaxRedshift) {
        newMaxRedshift = redshift
      }
      if (redshift < newMinRedshift) {
        newMinRedshift = redshift
      }

      if (isNaN(asc) || isNaN(dec) || isNaN(redshift)) continue

      if (useBuffer) {
        // Direct write to buffer
        const offset = currentIdx * STRIDE
        float64View[offset + OFFSET_RA] = asc
        float64View[offset + OFFSET_DEC] = dec
        float64View[offset + OFFSET_REDSHIFT] = redshift
        // Create lightweight Target view
        newTargets.push(new Target({ bufferView: float64View, index: currentIdx }))
      } else {
        // Fallback to object
        newTargets.push(new Target({ asc, dec, redshift }))
      }
      currentIdx++
    }

    subsetTargets.value = []
    setSelectedTargets([])
    targets.value = newTargets
    minRedshift.value = newMinRedshift
    maxRedshift.value = newMaxRedshift
  }

  function updateSubset(count) {
    if (!targets.value) {
      subsetTargets.value = []
      return
    }

    const total = targets.value.length
    if (count >= total) {
      subsetTargets.value = targets.value
      return
    }

    const step = total / count
    const subset = []
    for (let i = 0; i < total; i += step) {
      subset.push(targets.value[Math.floor(i)])
    }
    subsetTargets.value = subset
  }

  function save(filename='uv_catalog.dat') {
    if (!targets.value || targets.value.length === 0) return

    let content = ''
    const tList = targets.value
    const len = tList.length
    for (let i = 0; i < len; i++) {
      const t = tList[i]
      content += `${t.getAscension()} ${t.getDeclination()} ${t.getRedshift()}\n`
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function removeSelectedTargets() {
    const currentTargets = targets.value || [];
    const selectedItems = selectedTargets.value || [];
    const currentBuffer = sharedBuffer.value;

    // Handle case where SharedArrayBuffer is not available or not used
    if (!currentBuffer) {
      const selectedSet = new Set(selectedItems);
      const updatedTargets = currentTargets.filter(target => !selectedSet.has(target));
      targets.value = updatedTargets;
      selectedTargets.value = [];
      return;
    }

    const float64View = new Float64Array(currentBuffer);
    const selectedSet = new Set(selectedItems);
    const nonSelectedTargetsOriginalObjects = currentTargets.filter(target => !selectedSet.has(target));
    const numRemaining = nonSelectedTargetsOriginalObjects.length;
    if (numRemaining === currentTargets.length) {
      return;
    }

    // Create a new SharedArrayBuffer for the remaining targets
    let newBuffer;
    let newFloat64View;
    try {
      newBuffer = new SharedArrayBuffer(numRemaining * STRIDE * Float64Array.BYTES_PER_ELEMENT);
      newFloat64View = new Float64Array(newBuffer);
    } catch (e) {
      console.error('Failed to create new SharedArrayBuffer for removal:', e);
      return;
    }

    // Populate the new buffer and create new Target objects
    const newTargetsArray = [];
    for (let i = 0; i < numRemaining; i++) {
      const originalTarget = nonSelectedTargetsOriginalObjects[i];
      const oldOffset = originalTarget.offset;
      for (let j = 0; j < STRIDE; j++) {
        newFloat64View[i * STRIDE + j] = float64View[oldOffset + j];
      }
      const newTarget = new Target({ bufferView: newFloat64View, index: i });
      newTargetsArray.push(newTarget);
    }

    // Update the store with the new buffer and the new array of targets
    sharedBuffer.value = newBuffer;
    targets.value = newTargetsArray;
    selectedTargets.value = [];
  }

  function reverseSelectedTargets() {
    const currentTargets = targets.value || [];
    const selectedItems = selectedTargets.value || [];
    const selectedSet = new Set(selectedItems);
    const unselectedItems = currentTargets.filter(target => !selectedSet.has(target));
    selectedItems.forEach((ti) => {
      ti.setSelected(false)
    })
    unselectedItems.forEach((ti) => {
      ti.setSelected(true)
    })
    selectedTargets.value = unselectedItems;
  }

  function clearSelectedTargets() {
    const currentTargets = targets.value || [];
    currentTargets.forEach((ti) => {
      if (ti.setSelected) {
        ti.setSelected(false);
      }
    });
    selectedTargets.value = [];
  }

  function setTargets(tArray) {
    targets.value = tArray
  }

  function setSharedBuffer(buffer) {
    sharedBuffer.value = buffer
  }

  function selectTargetsByRedshiftRange(min, max, mode = 'replace') {
    if (!targets.value) return

    const tList = targets.value
    const len = tList.length
    const newSelected = []

    for (let i = 0; i < len; i++) {
      const t = tList[i]
      const r = t.getRedshift()
      const inRange = r >= min && r < max
      const wasSelected = t.isSelected ? t.isSelected() : false

      let shouldBeSelected = false

      if (mode === 'replace') {
        shouldBeSelected = inRange
      } else if (mode === 'additive') {
        shouldBeSelected = wasSelected || inRange
      } else if (mode === 'intersection') {
        shouldBeSelected = wasSelected && inRange
      }

      if (t.setSelected) t.setSelected(shouldBeSelected)
      if (shouldBeSelected) {
        newSelected.push(t)
      }
    }
    selectedTargets.value = newSelected
  }

  return {
    selectedCount,
    selectedTargets,
    targets,
    subsetTargets,
    minRedshift,
    maxRedshift,
    sharedBuffer,
    resolution,
    redshiftDistribution,
    selectionRedshiftDistribution,
    // Setters
    setSelectedTargets,
    load,
    updateSubset,
    save,
    removeSelectedTargets,
    reverseSelectedTargets,
    clearSelectedTargets,
    selectTargetsByRedshiftRange,
    setTargets,
    setSharedBuffer,
  }
})
