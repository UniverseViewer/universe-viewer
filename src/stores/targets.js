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
  }
})
