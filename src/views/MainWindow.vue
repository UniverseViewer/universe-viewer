<template>
  <v-app>
    <AppHelp v-model="helpOpened" :tab="helpTab" />
    <About v-model="aboutOpened" />
    <RedshiftDistribution v-model="redshiftDistributionOpened" />
    <v-main>
      <v-container fluid class="fill-height pa-0 ma-0">
        <v-row no-gutters style="height: 100dvh">
          <!-- LEFT SIDEBAR -->
          <v-col
            v-show="isSidebarOpen"
            cols="12"
            :sm="isSidebarOpen ? 6 : 0"
            :md="isSidebarOpen ? 3 : 0"
            class="bg-surface left-panel order-last order-sm-first"
            ref="leftPanel"
          >
            <MainToolbar @open-help="openHelp" />
          </v-col>

          <!-- MAIN VIEWER -->
          <v-col
            cols="12"
            :sm="isSidebarOpen ? 6 : 12"
            :md="isSidebarOpen ? 9 : 12"
            class="pa-0 viewer-col d-flex"
            :class="{
              expanded: !isSidebarOpen,
              'flex-column': !mobile || xs,
              'flex-row': mobile && !xs,
            }"
            style="height: 100%; position: relative"
          >
            <div class="d-flex flex-column flex-grow-1" style="min-width: 0; min-height: 0">
              <!-- Mobile RedshiftLegend/StatusBar -->
              <RedshiftLegend v-if="mobile" class="order-0" />
              <div v-if="mobile && busy" class="bg-surface w-100 order-1">
                <StatusBar />
              </div>

              <ViewerCanvas
                ref="viewer"
                @update-mouse-coords="onMouseCoordsUpdate"
                class="flex-grow-1 order-2"
                style="min-height: 0; min-width: 0"
              />

              <!-- Desktop RedshiftLegend (Absolute) -->
              <RedshiftLegend v-if="!mobile" />
            </div>

            <!-- RIGHT (OVERLAY / FLEX ITEM) -->
            <div
              v-if="constraintError === null"
              :class="mobile ? (xs ? 'order-first w-100' : 'order-last h-100') : 'right-sidebar'"
            >
              <ViewerToolbox @resetView="resetView" />
            </div>
            <div v-if="constraintError === null" class="bottom-right-info d-none d-md-block">
              <SelectionInfo />
            </div>
            <div v-if="constraintError === null" class="bottom-left-info d-none d-md-block">
              <SkyCoordinates
                :visible="isSkyMode && mouseRa !== null && mouseDec !== null"
                :mouse-ra="mouseRa || 0"
                :mouse-dec="mouseDec || 0"
              />
            </div>

            <!-- Sidebar Toggle Button -->
            <v-btn
              :icon="sidebarIcon"
              class="sidebar-toggle"
              size="small"
              variant="flat"
              rounded="lg"
              color="surface"
              @click="toggleSidebar"
            ></v-btn>

            <!-- PC StatusBar (Absolute Bottom) -->
            <div v-if="!mobile" class="viewer-statusbar bg-surface">
              <StatusBar />
            </div>
          </v-col>
        </v-row>
      </v-container>

      <v-overlay
        :model-value="busy"
        scrim="transparent"
        class="align-center justify-center"
        persistent
      >
      </v-overlay>

      <!-- BOTTOM INFO BAR -->
    </v-main>
  </v-app>
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

import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'
import ViewerCanvas from '@/components/ViewerCanvas.vue'
import { useUniverseStore } from '@/stores/universe.js'
import { useStatusStore } from '@/stores/status.js'

import MainToolbar from '@/components/MainToolbar.vue'
import About from '@/components/About.vue'
import AppHelp from '@/components/AppHelp.vue'
import RedshiftDistribution from '@/components/RedshiftDistribution.vue'
import ViewerToolbox from '@/components/ViewerToolbox.vue'
import StatusBar from '@/components/StatusBar.vue'
import SelectionInfo from '@/components/SelectionInfo.vue'
import SkyCoordinates from '@/components/SkyCoordinates.vue'
import RedshiftLegend from '@/components/RedshiftLegend.vue'

// Stores setup
const store = useUniverseStore()
const {
  viewerMode,
  redshiftDistributionOpened,
  helpOpened,
  aboutOpened,
  constraintError,
} = storeToRefs(store)

const statusStore = useStatusStore()
const { busy } = storeToRefs(statusStore)

// Viewer Ref
const viewer = ref(null)

const isSkyMode = computed(() => viewerMode.value === 'sky')

const mouseRa = ref(0)
const mouseDec = ref(0)

function onMouseCoordsUpdate({ x, y }) {
  mouseRa.value = x
  mouseDec.value = y
}

// Help
const helpTab = ref(undefined)

function openHelp(tab = 'overview') {
  helpOpened.value = true
  helpTab.value = tab
}

// Logic Updates

function resetView() {
  if (viewer.value) {
    viewer.value.resetView()
  }
}

// Mobile sidebar scroll logic
const { mobile, xs } = useDisplay()
const leftPanel = ref(null)

// Sidebar toggle
const isSidebarOpen = ref(true)

const sidebarIcon = computed(() => {
  if (xs.value) {
    // Portrait (Bottom)
    return isSidebarOpen.value ? 'mdi-chevron-down' : 'mdi-chevron-up'
  } else {
    // PC/Landscape/Tablet (Left)
    return isSidebarOpen.value ? 'mdi-chevron-left' : 'mdi-chevron-right'
  }
})

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<style scoped>
.left-panel {
  height: 100dvh;
  z-index: 25;
  position: relative;
  overflow: hidden;
}
.viewer-col {
  background: black;
}
@media (max-width: 600px) {
  .left-panel {
    height: 50% !important;
  }
  .viewer-col {
    height: 50% !important;
  }
  .right-sidebar {
    top: 0 !important;
    right: 0 !important;
  }
}
@media (max-width: 960px) and (orientation: landscape) {
  .right-sidebar {
    top: 0 !important;
    right: 0 !important;
  }
}
.right-sidebar {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
}
.bottom-right-info {
  position: absolute;
  bottom: 42px;
  right: 10px;
  z-index: 10;
}
.bottom-left-info {
  position: absolute;
  bottom: 42px;
  left: 10px;
  z-index: 10;
}
.sidebar-toggle {
  position: absolute;
  z-index: 20;
}
@media (max-width: 600px) {
  .sidebar-toggle {
    left: 50%;
    transform: translateX(-50%);
    bottom: -10px;
  }
}
@media (min-width: 601px) {
  .sidebar-toggle {
    top: 50%;
    transform: translateY(-50%);
    left: -10px;
  }
}
.viewer-col.expanded {
  height: 100% !important;
}
.viewer-statusbar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 15;
}
</style>