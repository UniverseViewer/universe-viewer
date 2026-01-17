<template>
  <v-select
    :disabled="disabled"
    :item-props="catalogProps"
    :items="catalogs"
    item-value="file"
    v-model="internalValue"
    v-model:menu="menuOpened"
    label="Load catalog"
    density="compact"
    prepend-icon="mdi-library-shelves"
  ></v-select>
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

defineOptions({
  name: 'CatalogBrowser',
})

const props = defineProps({
  modelValue: { type: String, default: null },
  disabled: { type: Boolean, default: false },
  opened: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'update:opened'])

let catalogs = ref([])
const internalValue = ref(props.modelValue)

const menuOpened = computed({
  get: () => props.opened,
  set: (val) => emit('update:opened', val),
})

function catalogProps(catalog) {
  return {
    title: catalog.name,
    subtitle: catalog.targets_number.toLocaleString() + ' targets, ' + catalog.year,
  }
}

// Sync internalValue with parent
watch(internalValue, (value) => {
  emit('update:modelValue', value)
})
// Sync parent with internalValue (parent updates)
watch(
  () => props.modelValue,
  (value) => {
    internalValue.value = value
  },
)

onMounted(() => {
  fetch('/catalogs/manifest.json')
    .then((response) => response.json())
    .then((data) => {
      catalogs.value = data
    })
    .catch((err) => console.error('Fetch error:', err))
})
</script>

<style scoped>
</style>
