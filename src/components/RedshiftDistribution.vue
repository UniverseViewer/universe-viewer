<template>
  <v-dialog v-model="dialog" max-width="800px" scrollable :fullscreen="isMobile">
    <v-card>
      <v-card-title>Redshift Distribution</v-card-title>
      <v-card-text :class="{ 'pa-0': isMobileLandscape }" class="chart-container">
        <div class="fill-height d-flex flex-column flex-nowrap">
          <div class="flex-grow-1 w-100" style="position: relative; min-height: 0">
            <canvas ref="chartCanvas"></canvas>
          </div>
          <div
            class="flex-shrink-0 w-100 pt-4"
            :class="{ 'd-flex align-center pt-1 px-2': isMobileLandscape }"
          >
            <v-slider
              v-model="resolution"
              :min="5"
              :max="100"
              :step="1"
              label="Resolution"
              thumb-label
              :hide-details="isMobileLandscape"
              :density="isMobileLandscape ? 'compact' : 'default'"
              :class="{ 'flex-grow-1 mr-4': isMobileLandscape }"
            ></v-slider>
            <v-switch
              v-model="showRedshiftGradient"
              label="Redshift Gradient"
              color="success"
              :hide-details="isMobileLandscape"
              :density="isMobileLandscape ? 'compact' : 'default'"
            />
          </div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn text @click="dialog = false">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
/*
 * Copyright (C) 2025-2026 Mathieu Abati <mathieu.abati@gmail.com>
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

import { computed, ref, watch, shallowRef, onBeforeUnmount, nextTick } from 'vue'
import { useCatalogStore } from '@/stores/catalog.js'
import { useThemeStore } from '@/stores/theme.js'
import { useUniverseStore } from '@/stores/universe.js'
import { Chart, registerables } from 'chart.js'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

defineOptions({
  name: 'RedshiftDistribution',
})

Chart.register(...registerables)

const { mobile, width, height } = useDisplay()
const isMobile = computed(() => mobile.value)
const isMobileLandscape = computed(() => mobile.value && width.value > height.value)

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
const universe = useUniverseStore()
const {
  redshiftDistribution,
  selectionRedshiftDistribution,
  selectedCount,
  resolution,
  minRedshift,
  maxRedshift,
} = storeToRefs(store)
const { canvasTheme, redshiftGradient } = storeToRefs(theme)
const { showRedshiftGradient } = storeToRefs(universe)

const chartCanvas = ref(null)
const chartInstance = shallowRef(null)

function getBarBackgroundColor(context) {
  if (!context.chart) return

  if (showRedshiftGradient.value) {
    const dataIndex = context.dataIndex
    const dataset = context.dataset
    const count = dataset.data.length
    const min = minRedshift.value
    const max = maxRedshift.value
    const step = (max - min) / count

    const barRedshift = min + dataIndex * step + step / 2 // Midpoint of the bar's redshift range

    let val = (barRedshift - min) / (max - min)
    if (val < 0) val = 0
    if (val > 1) val = 1
    const lutIdx = (val * 255) | 0
    const offset = lutIdx * 3

    const r = redshiftGradient.value[offset] * 255
    const g = redshiftGradient.value[offset + 1] * 255
    const b = redshiftGradient.value[offset + 2] * 255

    return `rgba(${r}, ${g}, ${b}, 0.8)`
  } else {
    // Default dark color if gradient is not shown
    const c = canvasTheme.value.point
    return `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, 0.5)`
  }
}

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
  chartInstance.value.data.datasets[0].backgroundColor = getBarBackgroundColor
  chartInstance.value.data.datasets[1].data = selectionRedshiftDistribution.value
  chartInstance.value.data.datasets[1].hidden = selectedCount.value === 0
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
              datasets: [
                {
                  label: 'Target Count',
                  data: redshiftDistribution.value,
                  backgroundColor: getBarBackgroundColor,
                  borderColor: `rgba(${canvasTheme.value.point.r * 255}, ${canvasTheme.value.point.g * 255}, ${canvasTheme.value.point.b * 255}, 1)`,
                  borderWidth: 1,
                },
                {
                  hidden: selectedCount.value === 0,
                  label: 'Selected Count',
                  data: selectionRedshiftDistribution.value,
                  backgroundColor: `rgba(${canvasTheme.value.selectedPoint.r * 255}, ${canvasTheme.value.selectedPoint.g * 255}, ${canvasTheme.value.selectedPoint.b * 255}, 0.5)`,
                  borderColor: `rgba(${canvasTheme.value.selectedPoint.r * 255}, ${canvasTheme.value.selectedPoint.g * 255}, ${canvasTheme.value.selectedPoint.b * 255}, 1)`,
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
              plugins: {
                legend: {
                  labels: {
                    filter: (legendItem, chartData) => {
                      return !chartData.datasets[legendItem.datasetIndex].hidden
                    },
                  },
                },
              },
              onClick: (event, elements) => {
                if (elements.length > 0) {
                  const element = elements[0]
                  // Only react to clicks on the Target Count dataset (index 0)
                  if (element.datasetIndex === 0) {
                    const index = element.index
                    const count = resolution.value
                    const min = minRedshift.value
                    const max = maxRedshift.value
                    const step = (max - min) / count
                    const rangeStart = min + index * step
                    // Ensure the last bin covers up to max (floating point safety)
                    const rangeEnd = index === count - 1 ? max + 0.0001 : rangeStart + step
                    let mode = 'replace'
                    if (event.native.shiftKey) mode = 'additive'
                    else if (event.native.ctrlKey) mode = 'intersection'
                    store.selectTargetsByRedshiftRange(rangeStart, rangeEnd, mode)
                  }
                }
              },
              onHover: (event, chartElement) => {
                event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default'
              },
            },
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

watch(
  [
    redshiftDistribution,
    selectionRedshiftDistribution,
    selectedCount,
    resolution,
    showRedshiftGradient,
  ],
  () => {
    updateChart()
  },
)

onBeforeUnmount(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }
})
</script>

<style scoped>
.chart-container {
  height: 70vh;
}
@media (max-width: 960px) and (orientation: landscape) {
  .chart-container {
    height: calc(100vh - 130px) !important;
  }
}
</style>
