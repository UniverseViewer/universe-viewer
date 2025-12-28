<template>
  <v-dialog v-model="dialog" max-width="800px" scrollable>
    <v-card>
      <v-card-title>Redshift Distribution</v-card-title>
      <v-card-text style="height: 70vh;">
        <div class="fill-height d-flex flex-column flex-nowrap">
          <div class="flex-grow-1 w-100" style="position: relative; min-height: 0;">
            <canvas ref="chartCanvas"></canvas>
          </div>
          <div class="flex-shrink-0 w-100 pt-4">
            <v-slider
              v-model="resolution"
              :min="5"
              :max="100"
              :step="1"
              label="Resolution"
              thumb-label
            ></v-slider>
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="dialog = false">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch, shallowRef, onBeforeUnmount, nextTick } from 'vue'
import { useCatalogStore } from '@/stores/catalog.js'
import { useThemeStore } from '@/stores/theme.js'
import { Chart, registerables } from 'chart.js'
import { storeToRefs } from 'pinia'

Chart.register(...registerables)

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const store = useCatalogStore()
const theme = useThemeStore()
const { redshiftDistribution, selectionRedshiftDistribution, selectedCount, resolution, minRedshift, maxRedshift } = storeToRefs(store)
const { canvasTheme } = storeToRefs(theme)

const chartCanvas = ref(null)
const chartInstance = shallowRef(null)

function getLabels() {
  const count = resolution.value
  const min = minRedshift.value
  const max = maxRedshift.value
  const step = (max - min) / count
  const labels = []
  for (let i = 0; i < count; i++) {
    const start = min + i * step
    const end = start + step
    labels.push(`${start.toFixed(2)} - ${end.toFixed(2)}`)
  }
  return labels
}

function updateChart() {
  if (!chartInstance.value) return

  chartInstance.value.data.labels = getLabels()
  chartInstance.value.data.datasets[0].data = redshiftDistribution.value
  chartInstance.value.data.datasets[1].data = selectionRedshiftDistribution.value
  chartInstance.value.update()
}

watch(dialog, (val) => {
  if (val) {
    nextTick(() => {
      setTimeout(() => {
        if (chartCanvas.value) {
          if (chartInstance.value) {
            chartInstance.value.destroy()
          }
          const ctx = chartCanvas.value.getContext('2d')
          chartInstance.value = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: getLabels(),
              datasets: [{
                label: 'Target Count',
                data: redshiftDistribution.value,
                backgroundColor: `rgba(${canvasTheme.value.point.r * 255}, ${canvasTheme.value.point.g * 255}, ${canvasTheme.value.point.b * 255}, 0.5)`,
                borderColor: `rgba(${canvasTheme.value.point.r * 255}, ${canvasTheme.value.point.g * 255}, ${canvasTheme.value.point.b * 255}, 1)`,
                borderWidth: 1
              },
              {
                hidden: selectedCount.value === 0,
                label: 'Selected Count',
                data: selectionRedshiftDistribution.value,
                backgroundColor: `rgba(${canvasTheme.value.selectedPoint.r * 255}, ${canvasTheme.value.selectedPoint.g * 255}, ${canvasTheme.value.selectedPoint.b * 255}, 0.5)`,
                borderColor: `rgba(${canvasTheme.value.selectedPoint.r * 255}, ${canvasTheme.value.selectedPoint.g * 255}, ${canvasTheme.value.selectedPoint.b * 255}, 1)`,
                borderWidth: 1
              }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: {
                  labels: {
                    filter: (legendItem, chartData) => {
                      return !chartData.datasets[legendItem.datasetIndex].hidden;
                    }
                  }
                }
              }
            }
          })
        }
      }, 100)
    })
  } else {
    if (chartInstance.value) {
      chartInstance.value.destroy()
      chartInstance.value = null
    }
  }
})

watch([redshiftDistribution, selectionRedshiftDistribution, selectedCount, resolution], () => {
  updateChart()
})

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }
})

</script>
