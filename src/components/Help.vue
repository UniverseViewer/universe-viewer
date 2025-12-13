<template>
  <v-dialog v-model="visible" width="auto">
    <v-card max-width="600" prepend-icon="mdi-information" title="Help">
      <v-tabs v-model="tab">
        <v-tab value="controls">Controls</v-tab>
        <v-tab value="data_format">Data format</v-tab>
      </v-tabs>
      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="controls">
            <strong>Zoom:</strong> scroll<br />
            <strong>Drag view or select (depends on mouse mode):</strong> left click<br />
            <strong>Additive selection (if selection mode):</strong> shift + left click<br />
            <strong>Intersevtion selection (if selection mode):</strong> ctrl + left click<br />
          </v-window-item>
          <v-window-item value="data_format">
            Data files must be text files, with a target entry per line.<br />
            <br />
            Target entry is formatted like this:
            <v-card variant="tonal" class="pa-4">
              <blockquote>RA Dec Z</blockquote>
            </v-card>
            <br />
            With:<br />
            <ul class="pl-6">
              <li>RA, the right ascension, in radians,</li>
              <li>Dec, the declination, in radians,</li>
              <li>Z, the redshift,</li>
            </ul>
            separated by spaces.
          </v-window-item>
        </v-window>
      </v-card-text>
      <template v-slot:actions>
        <v-btn class="ms-auto" text="Ok" @click="visible = false"></v-btn>
      </template>
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

import { ref, watch } from 'vue'

export default {
  name: 'Help',

  props: {
    modelValue: { type: Boolean, default: false },
    tab: { type: String, default: undefined },
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const visible = ref(props.modelValue)
    const tab = ref(props.tab || 'controls')

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
        tab.value = val || 'controls'
      },
    )

    return {
      visible,
      tab,
    }
  },
}
</script>

<style scoped></style>
