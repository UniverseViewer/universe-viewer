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

import { createApp } from 'vue'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
  },
})

import { createPinia } from 'pinia'
const pinia = createPinia()

createApp(App).use(vuetify).use(pinia).mount('#app')

import { useStatusStore } from '@/stores/status'
const statusStore = useStatusStore(pinia)
window.uv = {
  perf() {
    return {
      'view_refresh_rate_per_sec': statusStore.viewRefreshRate,
      'view_immediate_refresh_enabled': statusStore.isVueImmediateRefreshEnabled,
      'total_computation_duration_ms': statusStore.totalComputationDuration,
      'projections_computation_duration_ms': statusStore.projComputationDuration,
    }
  }
}
console.info(
  'Available console helpers:',
  'uv.perf()'
)
