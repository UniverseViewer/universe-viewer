<template>
  <v-dialog v-model="visible" width="auto" scrollable>
    <v-card max-width="800" height="600" max-height="90vh" class="d-flex flex-column">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-information" class="mr-2"></v-icon>
        UniverseViewer {{ version }}
      </v-card-title>

      <v-tabs v-model="tab">
        <v-tab value="software">Software</v-tab>
        <v-tab value="catalogs">Catalogs</v-tab>
      </v-tabs>

      <v-card-text style="height: 400px">
        <v-window v-model="tab">
          <v-window-item value="software">
            <div class="pa-4">
              &copy; 2008 - 2025
              <br />
              <br />
              <strong><a href="mailto:mathieu.abati@gmail.com">Mathieu Abati</a></strong> (2008 -
              2025)
              <br />
              <strong>Julie Fontaine</strong> (2008)
              <br />
              <br />
              Special thanks to <strong>Roland Triay</strong>
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
                        <strong>Link:</strong> <a :href="catalog.link" target="_blank" rel="noopener">{{ catalog.link }}</a>
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

<script>
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

import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'

export default {
  name: 'AboutDialog',

  props: {
    modelValue: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const store = useUniverseStore()
    const { version } = storeToRefs(store)

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
    return {
      version,
      visible,
      tab,
      catalogs,
    }
  },
}
</script>

<style scoped></style>
