<template>
  <v-dialog :model-value="true" persistent width="300">
    <v-card>
      <v-card-title class="text-subtitle-1">{{ title }}</v-card-title>
      <v-card-text>
        <v-progress-linear
          :model-value="percentage"
          height="10"
        ></v-progress-linear>
        <div class="d-flex justify-end text-caption mt-1">{{ percentage.toFixed(0) }}%</div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
})
</script>
