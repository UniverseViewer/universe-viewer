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
import { ref, shallowRef } from 'vue'

export const useTargetsStore = defineStore('targets', () => {
  const selectedCount = ref(0)
  const targets = shallowRef(null)

  function setSelectedCount(n) {
    selectedCount.value = n
  }

  function setTargets(tArray) {
    targets.value = tArray
  }

  function serialize() {
    if (!targets.value) return []
    return targets.value.map((t) => ({
      ascension: t.getAscension(),
      declination: t.getDeclination(),
      redshift: t.getRedshift(),
      angularDistance: t.getAngularDist(),
      pos: t.getPos()
        ? {
            x: t.getPos().getX(),
            y: t.getPos().getY(),
            z: t.getPos().getZ(),
            t: t.getPos().getT(),
          }
        : null,
    }))
  }

  return {
    selectedCount,
    targets,
    // Setters
    setSelectedCount,
    setTargets,
    serialize,
  }
})
