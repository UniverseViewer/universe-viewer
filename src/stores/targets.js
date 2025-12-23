/*
 * Copyright (C) 2025 Mathieu Abati <mathieu.abati@gmail.com>
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
import { computed, shallowRef, ref } from 'vue'
import Target, { STRIDE } from '@/logic/target.js'

export const useTargetsStore = defineStore('targets', () => {
  const selectedTargets = shallowRef([])
  const targets = shallowRef(null)
  const sharedBuffer = shallowRef(null)
  const lastUpdate = ref(Date.now())

  // Computed from selectedTargets array length
  const selectedCount = computed(() => selectedTargets.value.length)

  function setSelectedTargets(t) {
    selectedTargets.value = t
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
      touch();
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
    touch();
  }

  function setTargets(tArray) {
    targets.value = tArray
  }

  function setSharedBuffer(buffer) {
    sharedBuffer.value = buffer
  }

  function touch() {
    lastUpdate.value = Date.now()
  }

  return {
    selectedCount,
    selectedTargets,
    targets,
    sharedBuffer,
    lastUpdate,
    // Setters
    setSelectedTargets,
    setTargets,
    setSharedBuffer,
    touch,
    removeSelectedTargets,
  }
})
