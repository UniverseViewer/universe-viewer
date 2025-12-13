<template>
  <v-dialog
    v-model="visible"
    width="auto"
  >
    <v-card
      max-width="600"
      prepend-icon="mdi-information"
      title="Help"
    >
      <v-card-text>
        <strong>Zoom:</strong> scroll<br />
        <strong>Drag view or select (depends on mouse mode):</strong> left click<br />
        <strong>Additive selection (if selection mode):</strong> shift + left click<br />
        <strong>Intersevtion selection (if selection mode):</strong> ctrl + left click<br />
      </v-card-text>
      <template v-slot:actions>
        <v-btn
          class="ms-auto"
          text="Ok"
          @click="visible = false"
        ></v-btn>
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
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const visible = ref(props.modelValue)

    // Sync with parent
    watch(visible, value => {
      emit('update:modelValue', value)
    })
    // Sync parent (parent updates)
    watch(
      () => props.modelValue,
      value => {
        visible.value = value
      }
    )
    return {
      visible,
    }
  },
}
</script>

<style scoped>
</style>
