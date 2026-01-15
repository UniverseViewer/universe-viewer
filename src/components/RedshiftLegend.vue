<template>
  <div v-if="showRedshiftGradient" class="redshift-legend">
    <v-sheet class="d-flex align-center px-4 py-1" elevation="2" rounded color="surface">
      <span class="text-caption mr-2">Redshift</span>
      <span class="text-caption mr-1">{{ minRedshift ? minRedshift.toFixed(2) : '0.00' }}</span>
      <div :style="gradientStyle" class="mr-1 rounded"></div>
      <span class="text-caption mr-4">{{ maxRedshift ? maxRedshift.toFixed(2) : '0.00' }}</span>
      <div class="d-none d-md-block">
        <v-tooltip text="Show Redshift Distribution">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-chart-bar"
              variant="text"
              density="compact"
              size="small"
              @click="redshiftDistributionOpened = true"
            ></v-btn>
          </template>
        </v-tooltip>
      </div>
    </v-sheet>
  </div>
</template>

<script setup>
/*
 * Copyright (C) 2026 Mathieu Abati <mathieu.abati@gmail.com>
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

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useThemeStore } from '@/stores/theme.js'

const universeStore = useUniverseStore()
const catalogStore = useCatalogStore()
const themeStore = useThemeStore()

const { showRedshiftGradient, redshiftDistributionOpened } = storeToRefs(universeStore)
const { minRedshift, maxRedshift } = storeToRefs(catalogStore)
const { canvasTheme: theme, darkMode } = storeToRefs(themeStore)

const gradientStyle = computed(() => {
  const t = theme.value
  const c1 = t.redshiftNear
  const c2 = t.redshiftFar
  const color1 = `rgb(${Math.round(c1.r * 255)}, ${Math.round(c1.g * 255)}, ${Math.round(c1.b * 255)})`
  const color2 = `rgb(${Math.round(c2.r * 255)}, ${Math.round(c2.g * 255)}, ${Math.round(c2.b * 255)})`
  return {
    background: `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`,
    width: '120px',
    height: '12px',
    border: darkMode.value ? '1px solid #555' : '1px solid #ccc',
  }
})
</script>

<style scoped>
.redshift-legend {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  pointer-events: none;
}
.redshift-legend .v-sheet {
  pointer-events: auto;
}

@media (max-width: 600px), (max-width: 960px) and (orientation: landscape) {
  .redshift-legend {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    transform: none;
  }
  .redshift-legend .v-sheet {
    width: 100%;
    border-radius: 0 !important;
    justify-content: center;
  }
}
</style>
