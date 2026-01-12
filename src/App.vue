<template>
  <MainWindow />
  <SplashScreen />
</template>

<script setup>
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

import MainWindow from './views/MainWindow.vue'
import SplashScreen from './components/SplashScreen.vue'
import { storeToRefs } from 'pinia'
import { useStatusStore } from '@/stores/status.js'
import { useUniverseStore } from '@/stores/universe.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useThemeStore } from '@/stores/theme.js'
import { watch, onMounted } from 'vue'
import { useTheme } from 'vuetify'

const statusStore = useStatusStore()
const universeStore = useUniverseStore()
const catalogStore = useCatalogStore()
const themeStore = useThemeStore()
const { busy, viewRefreshRate } = storeToRefs(statusStore)
const { targets, subsetTargets } = storeToRefs(catalogStore)
const vuetifyTheme = useTheme()

onMounted(() => {
  universeStore.initialize()
  themeStore.initialize(vuetifyTheme)
})

watch(busy, (isBusy) => {
  if (isBusy) {
    document.body.classList.add('busy-cursor')
  } else {
    document.body.classList.remove('busy-cursor')
  }
})

watch(viewRefreshRate, (rate) => {
  if (subsetTargets.value && subsetTargets.value.length !== 0) return
  if (!targets.value || targets.value.length === 0) return
  if (rate <= 0) return

  // Approximation: 100 fps target.
  const total = targets.value.length
  const budget = Math.floor(total * (rate / 100.0))

  // Keep it reasonably sized (at least 1000 or 1%)
  const minBudget = Math.max(1000, Math.floor(total * 0.01))
  const finalBudget = Math.max(minBudget, budget)

  catalogStore.updateSubset(finalBudget)
})
</script>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  overflow: hidden;
}
a,
a:visited {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}
body.busy-cursor,
body.busy-cursor * {
  cursor: wait !important;
}
</style>
