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
        <strong>Drag view:</strong> right click / alt + left click<br />
        <strong>Select:</strong> left click<br />
        <strong>Additive selection:</strong> shift + left click<br />
        <strong>Intersevtion selection:</strong> ctrl + left click<br />
        <strong>Reset view:</strong> middle click<br />
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
