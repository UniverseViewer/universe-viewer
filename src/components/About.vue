<template>
  <v-dialog v-model="visible" width="auto" scrollable :fullscreen="isMobile">
    <v-card max-width="800">
      <v-card-title class="align-center d-md-none mb-2">
        <v-icon icon="mdi-information" class="mr-2"></v-icon>
        UniverseViewer {{ version }}
      </v-card-title>
      <v-img
        src="/splash.webp"
        class="text-white splash-image d-none d-md-block"
        cover
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
      >
        <div
          class="d-flex justify-space-between align-end pa-4"
          style="position: absolute; bottom: 0; left: 0; right: 0"
        >
          <div class="text-h3 font-weight-bold d-flex align-center">
            <img
              src="/logo.webp"
              alt="Logo"
              class="me-3"
              style="height: 1em; width: auto; display: block"
            />
            <span style="line-height: 1">Universe Viewer</span>
          </div>
          <div class="text-subtitle-1 text-right">
            <strong>{{ version }}</strong>
          </div>
        </div>
      </v-img>

      <v-tabs v-model="tab">
        <v-tab value="software">Software</v-tab>
        <v-tab value="catalogs">Catalogs</v-tab>
      </v-tabs>

      <v-card-text class="content">
        <v-window v-model="tab">
          <v-window-item value="software">
            <div class="pa-4">
              &copy; 2008 - 2026
              <br />
              <br />
              <strong><a href="mailto:mathieu.abati@gmail.com">Mathieu Abati</a></strong> (2008 - 2011, 2025 - 2026)
              - <a href="https://mathieu-abati.com/en">website</a>
              <br />
              <strong>Julie Fontaine</strong> (2008)
              <br />
              <br />
              Special thanks to <strong><a href="mailto:roland.triay@cpt.univ-mrs.fr">Roland Triay</a></strong>
              <br />
              <br />
              Based on
              <a href="https://amu.hal.science/hal-01431981/document" target="_blank" rel="noopener"
                >Framework for cosmography at high redshift</a
              >
              - R. Triay, L. Spinelli, R. Lafaye (1996)
              <br />
              <br />
              This software is provided "as is" without warranty of any kind. It is licensed under
              the terms of the
              <a
                href="https://www.gnu.org/licenses/old-licenses/gpl-2.0.html"
                target="_blank"
                rel="noopener"
                >GNU GENERAL PUBLIC LICENSE, version 2</a
              >.
              <br />
              <br />
              Visit the
              <a href="https://github.com/UniverseViewer/universe-viewer">
                <v-icon icon="mdi-github"></v-icon>
                GitHub page
              </a>
              <br />
              Read the <a href="https://mathieu-abati.com/en/projects/universe-viewer">implementation details</a> on author website
            </div>
          </v-window-item>

          <v-window-item value="catalogs">
            <v-container>
              <v-row>
                <v-col v-for="catalog in catalogs" :key="catalog.file" cols="12">
                  <v-card variant="tonal">
                    <v-card-title>{{ catalog.name }}</v-card-title>
                    <v-card-subtitle>{{ catalog.year }}</v-card-subtitle>
                    <v-card-text>
                      <div v-if="catalog.author"><strong>Author:</strong> {{ catalog.author }}</div>
                      <div v-if="catalog.link">
                        <strong>Link:</strong>
                        <a :href="catalog.link" target="_blank" rel="noopener">{{
                          catalog.link
                        }}</a>
                      </div>
                      <div v-if="catalog.license">
                        <strong>License:</strong> {{ catalog.license }}
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Ok" @click="visible = false"></v-btn>
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

import { onMounted, ref, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'
import { useDisplay } from 'vuetify'

defineOptions({
  name: 'AboutDialog',
})

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const store = useUniverseStore()
const { version } = storeToRefs(store)
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const visible = ref(props.modelValue)
const tab = ref('software')
const catalogs = ref([])

onMounted(() => {
  fetch('/catalogs/manifest.json')
    .then((response) => response.json())
    .then((data) => {
      catalogs.value = data
    })
    .catch((err) => console.error('Fetch error:', err))
})

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
</script>

<style scoped>
.splash-image {
  height: 200px;
}

:deep(.v-tabs) {
  flex: 0 0 auto !important;
}
</style>
