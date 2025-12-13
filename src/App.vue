<template>
  <MainWindow />
</template>

<script setup>
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

import MainWindow from './views/MainWindow.vue'
import { useBusyStore } from '@/stores/busy.js'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

const busyStore = useBusyStore()
const { busy } = storeToRefs(busyStore)

watch(busy, (isBusy) => {
  if (isBusy) {
    document.body.classList.add('busy-cursor')
  } else {
    document.body.classList.remove('busy-cursor')
  }
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
