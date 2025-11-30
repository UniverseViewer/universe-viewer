<template>
  <v-select
    :item-props="catalogProps"
    :items="catalogs"
    item-value="file"
    v-model="internalValue"
    label="Load catalog"
    density="compact"
    prepend-icon="mdi-library-shelves"
  ></v-select>
</template>

<script>
import { onMounted, ref, watch } from 'vue'

export default {
  name: 'CatalogBrowser',

  props: {
    modelValue: { type: String, default: null }   // parent → child
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    let catalogs = ref([])
    const internalValue = ref(props.modelValue)

    function catalogProps (catalog) {
      return {
        title: catalog.name,
        subtitle: catalog.year,
      }
    }

    // Sync internalValue with parent
    watch(internalValue, value => {
      emit('update:modelValue', value)
    })
    // Sync parent with internalValue (parent updates)
    watch(
      () => props.modelValue,
      value => {
        internalValue.value = value
      }
    )

    onMounted(() => {
      fetch('/catalogs/manifest.json')
        .then(response => response.json())
          .then(data => {
            catalogs.value = data
          })
        .catch(err => console.error('Fetch error:', err))
    })

    return {
      catalogs,
      catalogProps,
      internalValue,
    }
  },
}
</script>

<style scoped>
</style>
