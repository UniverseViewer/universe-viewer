<template>
  <v-dialog
    v-model="visible"
    width="auto"
  >
    <v-card
      max-width="600"
      prepend-icon="mdi-information"
      :title="'UniverseViewer ' + version"
    >
      <v-card-text>
        &copy; 2008 - 2025
        <br />
        <br />
        <strong><a href="mailto:mathieu.abati@gmail.com">Mathieu Abati</a></strong> (2008 - 2025)
        <br />
        <strong>Julie Fontaine</strong> (2008)
        <br />
        <br />
        Special thanks to <strong>Roland Triay</strong>
        <br />
        <br />
        Based on <a href="https://amu.hal.science/hal-01431981/document" target="_blank" rel="noopener">Framework for cosmography at high redshift</a> - R. Triay, L. Spinelli, R. Lafaye (1996)
        <br />
        <br />
        This software is provided "as is" without warranty of any kind.
        It is licensed under the terms of the <a href="https://www.gnu.org/licenses/old-licenses/gpl-2.0.html" target="_blank" rel="noopener">GNU GENERAL PUBLIC LICENSE, version 2</a>.
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
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUniverseStore } from '@/stores/universe.js'

export default {
  name: 'CatalogBrowser',

  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const store = useUniverseStore()
    const {
      version,
    } = storeToRefs(store)

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
      version,
      visible,
    }
  },
}
</script>

<style scoped>
</style>
