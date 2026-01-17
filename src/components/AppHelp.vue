<template>
  <v-dialog v-model="visible" width="700" :fullscreen="isMobile" scrollable>
    <v-card prepend-icon="mdi-help-circle" title="User Documentation">
      <v-tabs v-model="currentTab" bg-color="surface" grow>
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="catalogs">Catalogs</v-tab>
        <v-tab value="controls">Navigation</v-tab>
        <v-tab value="viewing">Viewing</v-tab>
        <v-tab value="cosmology">Cosmology</v-tab>
        <v-tab value="data_format">Data format</v-tab>
      </v-tabs>
      <v-card-text class="pa-0" style="height: 500px">
        <v-window v-model="currentTab" class="pa-4">
          <!-- OVERVIEW TAB -->
          <v-window-item value="overview">
            <h3 class="text-h6 mb-2">Welcome to Universe Viewer</h3>
            <p class="mb-4 text-body-1">
              Universe Viewer is an interactive 3D tool designed for the visualization and geodesic analysis of high-redshift astronomical objects.
              It allows to visualize the large-scale structure of the Universe.

            </p>
            <p class="mb-4 text-body-2">
              By leveraging standard cosmological models, the application projects astronomical
              data (such as quasars, AGNs, and galaxies) into a navigable 3D coordinate system. This
              allows researchers and enthusiasts to explore the distribution of matter as it truly
              is across cosmic time and space, rather than just as a flat projection on the sky.
            </p>
            <v-img src="/splash.webp" class="rounded border mb-4" max-height="200" cover></v-img>
            <p class="text-body-2 italic">
              Use the tabs above to learn how to navigate, customize your view, and understand the
              underlying cosmological parameters.
            </p>
          </v-window-item>

          <!-- CATALOGS TAB -->
          <v-window-item value="catalogs">
            <h3 class="text-h6 mb-2">Astronomical catalogs</h3>
            <p class="mb-4 text-body-1">
              Universe Viewer comes with a bunch of well-known astronomical catalogs, you can choose one from the Catalogs menu.
              For each, you can see the astronomical targets number it contains, and the year of publication.
            </p>
            <v-alert type="info" variant="tonal" density="compact" class="mt-4 border">
              <div class="text-caption">
                <strong>Tip:</strong> For huge catalogs, you can load only a subset of its data if your machine is not powerful enough to handle the full dataset.
                To do this, configure the percentage of data to load, and the selected subset targets will be picked uniformly distributed in the catalog.
              </div>
            </v-alert>
            <br />
            <p class="mb-4 text-body-1">
              It is also possible to load an external catalog, which has to match the Universe Viewer data format.
              <a @click="currentTab = 'data_format'" href="javascript:void(0);">Learn more&hellip;</a>
            </p>

            <v-divider class="mb-4"></v-divider>

            <div class="text-subtitle-1 font-weight-bold">Redshift distribution</div>
            <p class="text-body-2 mb-2">
              Catalog targets redshift distribution can be displayed using the <v-icon icon="mdi-chart-bar"></v-icon> <strong>Redshift Distribution</strong> icon in the
              toolbox.
            </p>
          </v-window-item>

          <!-- NAVIGATION TAB -->
          <v-window-item value="controls">
            <h3 class="text-h6 mb-2">Interacting with the Universe</h3>

            <v-list density="compact" lines="two">
              <v-list-item prepend-icon="mdi-mouse-wheel">
                <v-list-item-title>Zooming</v-list-item-title>
                <v-list-item-subtitle
                  >Use the mouse wheel, trackpad scroll, or two fingers to move closer or further
                  away.</v-list-item-subtitle
                >
              </v-list-item>
            </v-list>

            <p class="mb-4 text-body-2">
              The viewer provides two main modes, which you can toggle in the toolbox.
            </p>

            <v-list density="compact" lines="two">
              <v-list-item prepend-icon="mdi-cursor-move">
                <v-list-item-title>Move Mode (Default)</v-list-item-title>
                <v-list-item-subtitle
                  >Left-click or touch and drag to move viewer area.</v-list-item-subtitle
                >
              </v-list-item>

              <v-list-item prepend-icon="mdi-selection-drag">
                <v-list-item-title>Selection Mode</v-list-item-title>
                <v-list-item-subtitle
                  >Left-click or touch and drag to select targets. Clicking a single target selects only
                  it.</v-list-item-subtitle
                >
              </v-list-item>
            </v-list>

            <v-alert type="info" variant="tonal" density="compact" class="mt-4 border">
              <div class="text-caption">
                <strong>Tip:</strong> While in selection mode, use
                <strong>Shift + Click</strong> to add to selection, or
                <strong>Ctrl + Click</strong> to intersect selections.
              </div>
            </v-alert>

            <br />
            <p class="mb-4 text-body-2">
              You can reset the viewer using the <v-icon icon="mdi-image-filter-center-focus"></v-icon> icon from toolbox.
            </p>
          </v-window-item>

          <!-- VIEWING TAB -->
          <v-window-item value="viewing">
            <h3 class="text-h6 mb-2">Visualization Modes</h3>

            <div class="mb-4">
              <div class="text-subtitle-1 font-weight-bold">
                <v-icon icon="mdi-telescope"></v-icon>
                Universe vs Sky View
              </div>
              <p class="text-body-2">
                <strong>Universe View:</strong> Visualizes targets in 3D cosmological space.
                <br />
                <strong>Sky View:</strong> Visualizes targets as seen from Earth, mapped onto the
                celestial sphere (RA/Dec).
              </p>
            </div>

            <div class="mb-4">
              <div class="text-subtitle-1 font-weight-bold">Projection Controls</div>
              <p class="text-body-2 mb-2">
                When in Universe mode, you can project the 4D spacetime coordinates onto different
                2D planes:
              </p>
              <ul class="text-body-2 pl-6">
                <li><strong>Front 1-3:</strong> Front-on views along different axes.</li>
                <li><strong>Edge 1-3:</strong> Side-on (edge-on) views of the distribution.</li>
              </ul>
              <p class="text-body-2 mt-2">
                Use <strong>RA1</strong>, <strong>Dec1</strong>, and <strong>Beta</strong> sliders
                to orient the observer's view.
              </p>
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="text-subtitle-1 font-weight-bold">Display</div>
            <p class="text-body-2 mb-2">
              Adjust the <strong>Target point size</strong> in the sidebar to make distant galaxies
              more visible.
              <br />
              You can also toggle the <v-icon icon="mdi-palette"></v-icon> <strong>Redshift Gradient</strong> icon in the
              toolbox to color targets by their distance from Earth.
            </p>
          </v-window-item>

          <!-- COSMOLOGY TAB -->
          <v-window-item value="cosmology">
            <h3 class="text-h6 mb-4">Cosmological Parameters</h3>

            <p class="text-body-2 mb-4">
              Universe Viewer uses standard Friedmann-Lemaître-Robertson-Walker (FLRW)
              cosmology. The geometry of space is determined by:
            </p>

            <v-table density="compact" class="border rounded">
              <thead>
                <tr>
                  <th class="text-left">Symbol</th>
                  <th class="text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Lambda (λ)</strong></td>
                  <td>Cosmological constant (Dark Energy density).</td>
                </tr>
                <tr>
                  <td><strong>Omega (Ω)</strong></td>
                  <td>Matter density parameter.</td>
                </tr>
                <tr>
                  <td><strong>Kappa (k)</strong></td>
                  <td>Curvature of space. Positive (closed), Zero (flat), Negative (open).</td>
                </tr>
                <tr>
                  <td><strong>Alpha (α)</strong></td>
                  <td>Radiation density (CMB photons).</td>
                </tr>
              </tbody>
            </v-table>
            <p>
              Use the radio buttons to select which parameter should be derived automatically from the others.
            </p>
            <v-alert
              color="warning"
              variant="tonal"
              class="mt-4"
              density="compact"
              icon="mdi-alert"
            >
              <div class="text-caption">
                The parameters must satisfy the constraint: <strong>λ - k + Ω + α = 1</strong>.
                This constraint is automatically resolved by Universe Viewer which modifies the derived parameter.
              </div>
            </v-alert>

            <p class="text-body-2 mt-4 italic">
              Check <strong>Comoving space</strong> to visualize the expansion-corrected coordinate
              system.
            </p>
          </v-window-item>

          <!-- DATA FORMAT TAB -->
          <v-window-item value="data_format">
            <h3 class="text-h6 mb-2">External Catalog Format</h3>
            <p class="mb-4 text-body-2">
              You can load your own data as <code>.dat</code> or <code>.txt</code> files.
            </p>

            <v-card variant="outlined" class="pa-4 bg-grey-darken-4 text-mono">
              <pre style="overflow: auto">
# RA (rad)  Dec (rad)  Redshift
3.456       0.123      0.5
1.200      -0.540      1.2
...</pre
              >
            </v-card>

            <div class="mt-4 text-body-2">
              <p>Rules for file parsing:</p>
              <ul class="pl-6 mt-2">
                <li>One target per line.</li>
                <li>Three numerical values separated by spaces or tabs.</li>
                <li>
                  Values order: <strong>Right Ascension</strong> (rad),
                  <strong>Declination</strong> (rad), <strong>Redshift</strong>.
                </li>
                <li>Lines starting with <code>#</code> are ignored (comments).</li>
              </ul>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn text="Got it" prepend-icon="mdi-check" @click="visible = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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

import { ref, watch, computed } from 'vue'
import { useDisplay } from 'vuetify'

defineOptions({
  name: 'AppHelp',
})

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tab: { type: String, default: undefined },
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
const currentTab = ref(props.tab || 'overview')
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// Sync with parent
watch(visible, (value) => {
  emit('update:modelValue', value)
})
// Sync parent (parent updates)
watch(
  () => props.modelValue,
  (value) => {
    visible.value = value
  },
)

watch(
  () => props.tab,
  (val) => {
    currentTab.value = val || 'overview'
  },
)
</script>

<style scoped>
.text-mono {
  font-family: 'Roboto Mono', monospace;
  font-size: 0.85rem;
}

:deep(.v-tabs) {
  flex: 0 0 auto !important;
}
</style>
