<template>
  <div ref="root" :class="['viewer-root', (busy && !isInteracting && !isVueImmediateRefreshEnabled) ? 'busy' : '', mouseMode, constraintError ? 'constraint-error' : '']">
    <!-- Three.js canvas will be appended here -->
    <div ref="overlay" class="overlay"></div>

    <!-- Selection rectangle (HTML overlay) -->
    <div v-show="isSelecting" :style="selectionStyle" class="selection-rect"></div>

    <!-- HUD (mode, points count) -->
    <div :class="['hud', themeName]">
      <div>{{ modeName }}</div>
    </div>

    <!-- Constraint Error Message -->
    <div v-if="constraintError" class="error-message-overlay">
      <div class="error-message-box">
        <div class="error-message-title">You broke the Universe!</div>
        <pre class="error-message-details">{{ constraintError }}</pre>
      </div>
    </div>

    <!-- Redshift Gradient Legend -->
    <div v-if="showRedshiftGradient" class="redshift-legend">
      <v-sheet class="d-flex align-center px-4 py-1" elevation="2" rounded color="surface">
        <span class="text-caption mr-2">Redshift</span>
        <span class="text-caption mr-1">{{ minRedshift ? minRedshift.toFixed(2) : '0.00' }}</span>
        <div :style="gradientStyle" class="mr-1 rounded"></div>
        <span class="text-caption">{{ maxRedshift ? maxRedshift.toFixed(2) : '0.00' }}</span>
      </v-sheet>
    </div>
  </div>
</template>

<script>
/*
 * Copyright (C) 2008-2026 Mathieu Abati <mathieu.abati@gmail.com>
 * Copyright (C) 2008 Julie Fontaine
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

import { onMounted, onBeforeUnmount, ref, reactive, computed, markRaw } from 'vue'
import { storeToRefs } from 'pinia'
import * as THREE from 'three'
import * as projection from '@/logic/projection.js'
import { OFFSET_RA, OFFSET_DEC, OFFSET_PROJ_X, OFFSET_PROJ_Y } from '@/logic/target.js'
import { useUniverseStore } from '@/stores/universe.js'
import { useCatalogStore } from '@/stores/catalog.js'
import { useStatusStore } from '@/stores/status.js'
import { useThemeStore } from '@/stores/theme.js'
import { watch } from 'vue'

export default {
  name: 'ViewerCanvas',

  emits: ['update-mouse-coords'],

  setup(props, { expose, emit }) {
    const root = ref(null)
    const overlay = ref(null)

    const universeStore = useUniverseStore()
    const catalogStore = useCatalogStore()
    const statusStore = useStatusStore()
    const themeStore = useThemeStore()
    const {
      kappa,
      lambda,
      omega,
      alpha,
      view,
      pointSize,
      comovingSpaceFlag,
      horizonAngularDistance,
      viewerMode,
      userRA1,
      userDec1,
      userBeta,
      precisionEnabled,
      mouseMode,
      showRefMarks,
      showRedshiftGradient,
      constraintError,
    } = storeToRefs(universeStore)
    const { busy, isVueImmediateRefreshEnabled, isInteracting } = storeToRefs(statusStore)
    const { targets, subsetTargets, selectedTargets, minRedshift, maxRedshift } = storeToRefs(catalogStore)
    const { canvasTheme: theme, themeName, darkMode, redshiftGradient } = storeToRefs(themeStore)

    const activeTargets = computed(() => {
      if (isInteracting.value && !isVueImmediateRefreshEnabled.value) {
        return subsetTargets.value
      }
      return targets.value
    })

    const state = reactive({
      zoom: 0.5,
      zoomChanged: false,
      posX: 0.0,
      posY: 0.0,
      xMin: -1,
      yMin: -1,
      xMax: 1,
      yMax: 1,
      selectX1: 0,
      selectY1: 0,
      selectX2: 0,
      selectY2: 0,
      isSelecting: false,
      selectionType: 'replace',
      ctrlKeyPressed: false,
      shiftKeyPressed: false,
      altKeyPressed: false,
      mouseX: 0,
      mouseY: 0,
      mode: 0,
      SKY_MODE: 1,
      UNIVERSE_MODE: 0,
      renderer: null,
      scene: null,
      camera: null,
      points: null,
      geometry: null,
      material: null,
      refGroup: null,
      highlightScale: 1.0,
    })

    const modeName = computed(() => {
      let value
      if (state.mode === state.UNIVERSE_MODE) {
        value = 'Universe view, '
        value += comovingSpaceFlag.value ? 'comoving space' : 'reference space'
      } else {
        value = 'Sky view'
      }
      return value
    })

    const gradientStyle = computed(() => {
      const t = theme.value
      const c1 = t.redshiftNear
      const c2 = t.redshiftFar
      const color1 = `rgb(${Math.round(c1.r * 255)}, ${Math.round(c1.g * 255)}, ${Math.round(c1.b * 255)})`
      const color2 = `rgb(${Math.round(c2.r * 255)}, ${Math.round(c2.g * 255)}, ${Math.round(c2.b * 255)})`
      return {
        background: `linear-gradient(90deg, ${color1} 0%, ${color2} 100%)`,
        width: '120px',
        height: '12px',
        border: darkMode.value ? '1px solid #555' : '1px solid #ccc'
      }
    })

    const selectionStyle = computed(() => {
      const x = Math.min(state.selectX1, state.selectX2)
      const y = Math.min(state.selectY1, state.selectY2)
      const w = Math.abs(state.selectX2 - state.selectX1)
      const h = Math.abs(state.selectY2 - state.selectY1)
      return {
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
      }
    })

    let resizeObserver = null

    function onResize() {
      if (!root.value || !state.renderer || !state.camera) return

      const width = root.value.clientWidth
      const height = root.value.clientHeight

      state.renderer.setSize(width, height)

      let contentWorldWidth
      let contentWorldHeight

      if (state.mode === state.UNIVERSE_MODE) {
        contentWorldWidth = state.xMax - state.xMin // 2 units
        contentWorldHeight = state.yMax - state.yMin // 2 units
      } else {
        // SKY_MODE
        contentWorldWidth = state.xMax - state.xMin // 2 * Math.PI units
        contentWorldHeight = state.yMax - state.yMin // Math.PI units
      }

      const viewAspectRatio = width / height
      const contentAspectRatio = contentWorldWidth / contentWorldHeight

      let halfVisibleWorldWidth
      let halfVisibleWorldHeight

      if (viewAspectRatio >= contentAspectRatio) {
        halfVisibleWorldHeight = contentWorldHeight / 2
        halfVisibleWorldWidth = halfVisibleWorldHeight * viewAspectRatio
      } else {
        halfVisibleWorldWidth = contentWorldWidth / 2
        halfVisibleWorldHeight = halfVisibleWorldWidth / viewAspectRatio
      }

      state.camera.left = -halfVisibleWorldWidth
      state.camera.right = halfVisibleWorldWidth
      state.camera.top = halfVisibleWorldHeight
      state.camera.bottom = -halfVisibleWorldHeight

      updateCameraBounds() // This will apply state.posX, state.posY, state.zoom
      render()
    }

    function setMode(m) {
      if (m === state.UNIVERSE_MODE) {
        state.xMin = -1
        state.yMin = -1
        state.xMax = 1
        state.yMax = 1
        state.posX = 0 // Center of -1 to 1
        state.posY = 0 // Center of -1 to 1
        state.zoom = 0.5
      } else if (m === state.SKY_MODE) {
        state.xMin = 0
        state.yMin = -Math.PI / 2
        state.xMax = 2 * Math.PI
        state.yMax = Math.PI / 2
        state.posX = Math.PI // Center of 0 to 2*PI
        state.posY = 0 // Center of -Math.PI/2 to Math.PI/2
        state.zoom = 1
      } else {
        return
      }
      state.mode = m
      onResize() // Trigger full recalculation of viewSpans and camera bounds
    }
    function pixelToWorld(clientX, clientY) {
      const rect = root.value.getBoundingClientRect()
      const localX = clientX - rect.left
      const localY = clientY - rect.top
      const u = (2.0 * localX - rect.width) / rect.width // -1 to 1 in normalized device coords
      const v = -(2.0 * localY - rect.height) / rect.height // -1 to 1 in normalized device coords

      // Current center of camera view is camera.position
      const cx = state.camera.position.x
      const cy = state.camera.position.y

      // Calculate half-width/height of the currently visible world area
      const halfVisibleWorldWidth = (state.camera.right - state.camera.left) / 2 / state.camera.zoom
      const halfVisibleWorldHeight =
        (state.camera.top - state.camera.bottom) / 2 / state.camera.zoom

      const worldX = cx + u * halfVisibleWorldWidth
      const worldY = cy + v * halfVisibleWorldHeight

      return { worldX, worldY, pixelX: localX, pixelY: localY }
    }

    function createOrthoCamera() {
      const near = -1000
      const far = 1000

      const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, near, far) // Dummy values
      cam.zoom = state.zoom
      cam.updateProjectionMatrix()
      cam.position.set(0, 0, 10)
      cam.lookAt(0, 0, 0)
      return cam
    }

    function updateCameraBounds() {
      if (!state.camera) return

      state.camera.position.x = state.posX
      state.camera.position.y = state.posY
      state.camera.zoom = state.zoom
      state.camera.updateProjectionMatrix()
    }

    function createCircleTexture() {
      const size = 128
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')

      context.beginPath()
      context.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
      context.fillStyle = 'white'
      context.fill()

      return new THREE.CanvasTexture(canvas)
    }

    function initThree() {
      const width = root.value.clientWidth
      const height = root.value.clientHeight

      state.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true }))
      state.renderer.setSize(width, height)
      state.renderer.setPixelRatio(window.devicePixelRatio || 1)
      root.value.appendChild(state.renderer.domElement)

      state.scene = markRaw(new THREE.Scene())
      state.scene.background = new THREE.Color(theme.value.background)
      state.camera = markRaw(createOrthoCamera())

      state.geometry = markRaw(new THREE.BufferGeometry())
      state.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
      state.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 3))
      state.geometry.setAttribute('isHighlighted', new THREE.Float32BufferAttribute([], 1))

      const circleTexture = createCircleTexture()

      state.material = markRaw(
        new THREE.PointsMaterial({
          size: pointSize.value,
          vertexColors: true,
          sizeAttenuation: false,
          map: circleTexture,
          transparent: true,
          alphaTest: 0.5,
        }),
      )

      state.material.onBeforeCompile = (shader) => {
        shader.uniforms.uHighlightScale = { value: state.highlightScale }
        shader.vertexShader = `
          attribute float isHighlighted;
          uniform float uHighlightScale;
          ${shader.vertexShader}
        `
          .replace(
            'gl_PointSize = size;',
            'gl_PointSize = size * (1.0 + isHighlighted * (uHighlightScale - 1.0));',
          )
          .replace(
            '#include <project_vertex>',
            `#include <project_vertex>
            if (isHighlighted > 0.5 && uHighlightScale > 1.0) {
              gl_Position.z -= 0.01;
            }`,
          )
        state.material.userData.shader = shader
      }

      state.points = markRaw(new THREE.Points(state.geometry, state.material))
      state.scene.add(state.points)

      state.refGroup = markRaw(new THREE.Group())
      state.scene.add(state.refGroup)

      onResize() // Set initial camera projection based on current size

      // Check if there's an existing constraint error on mount
      if (constraintError.value) {
        clearCanvasContent()
      } else {
        updateCanvas() // Initial update if no error
      }
    }

    watch(viewerMode, (newMode) => {
      statusStore.runBusyTask(() => {
        if (newMode === 'sky') {
          setMode(state.SKY_MODE)
        } else {
          setMode(state.UNIVERSE_MODE)
        }
        updateCanvas()
      }, 'Calculating view')
    })

    watch(pointSize, (newValue) => {
      if (state.material) {
        state.material.size = newValue
        render()
      }
    })

    watch(theme, () => {
      statusStore.runBusyTask(() => {
        if (state.scene) {
          state.scene.background = new THREE.Color(theme.value.background)
          updatePointsColor()
          drawReferenceMarks()
          render()
        }
      }, 'Updating render')
    })

    async function recomputeAll() {
      await statusStore.runBusyTask(async () => {
        await projection.updateAll(
          activeTargets.value,
          view.value,
          userRA1.value,
          userDec1.value,
          userBeta.value,
          comovingSpaceFlag.value,
          kappa.value,
          lambda.value,
          omega.value,
          alpha.value,
          precisionEnabled.value,
        )
        updateCanvas()
      })
    }

    async function recomputeView() {
      await statusStore.runBusyTask(async () => {
        await projection.updateView(
          activeTargets.value,
          view.value,
          userRA1.value,
          userDec1.value,
          userBeta.value,
        )
        updateCanvas()
      })
    }

    watch([lambda, omega, kappa, alpha, precisionEnabled, comovingSpaceFlag], () => {
      recomputeAll()
    })

    watch([view, userRA1, userDec1, userBeta], () => {
      recomputeView()
    })

    watch(targets, () => {
      recomputeAll()
    })

    watch(showRedshiftGradient, () => {
      statusStore.runBusyTask(() => {
        updatePointsColor()
        render()
      })
    })

    watch(showRefMarks, () => {
      drawReferenceMarks()
      render()
    })

    watch(selectedTargets, () => {
      updateCanvas()
    })

    function updatePointsColor() {
      const geometry = state.geometry
      if (!geometry) return

      const t = activeTargets.value || []
      const N = t.length

      const colors = geometry.attributes.color
      if (!colors || colors.count !== N) {
        // Fallback to full rebuild if color attribute is missing or count mismatches.
        // This handles cases where targets have been added/removed.
        populatePoints()
        return
      }

      if (N === 0) return

      const themeVal = theme.value
      const gradient = redshiftGradient.value
      const showGradient = showRedshiftGradient.value
      const minRed = minRedshift.value
      const maxRed = maxRedshift.value
      const rangeInv = (maxRed - minRed) > 1e-9 ? 1.0 / (maxRed - minRed) : 0

      const pointR = themeVal.point.r
      const pointG = themeVal.point.g
      const pointB = themeVal.point.b
      const selR = themeVal.selectedPoint.r
      const selG = themeVal.selectedPoint.g
      const selB = themeVal.selectedPoint.b

      for (let i = 0; i < N; i++) {
        const ti = t[i]
        const selected = ti.isSelected ? ti.isSelected() : false

        let r, g, b
        if (selected) {
          r = selR
          g = selG
          b = selB
        } else {
          if (showGradient) {
            let val = (ti.getRedshift() - minRed) * rangeInv
            if (val < 0) val = 0
            if (val > 1) val = 1
            const lutIdx = (val * 255) | 0
            const offset = lutIdx * 3
            r = gradient[offset]
            g = gradient[offset + 1]
            b = gradient[offset + 2]
          } else {
            r = pointR
            g = pointG
            b = pointB
          }
        }
        colors.setXYZ(i, r, g, b)
      }
      colors.needsUpdate = true

      const highlighted = geometry.attributes.isHighlighted
      if (highlighted && highlighted.count === N) {
        for (let i = 0; i < N; i++) {
          const ti = t[i]
          const selected = ti.isSelected ? ti.isSelected() : false
          highlighted.setX(i, selected ? 1.0 : 0.0)
        }
        highlighted.needsUpdate = true
      }
    }

    function populatePoints() {
      if (constraintError.value) { return } // Exit early if constraint error is active
      const t = activeTargets.value || []
      const N = t.length

      // Check for SharedArrayBuffer support
      const buffer = catalogStore.sharedBuffer
      const isZeroCopy = t[0] && t[0].isBufferBacked && buffer
      let float64View = null
      if (isZeroCopy) {
        float64View = new Float64Array(buffer)
      }

      // Reuse existing buffers if size matches
      let positions, colors
      const existingPos = state.geometry.getAttribute('position')
      const existingCol = state.geometry.getAttribute('color')

      if (existingPos && existingPos.count === N) {
        positions = existingPos.array
        colors = existingCol.array
      } else {
        if (N === 0) {
          state.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
          state.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 3))
          state.geometry.setAttribute('isHighlighted', new THREE.Float32BufferAttribute([], 1))
          return
        }
        positions = new Float32Array(N * 3)
        colors = new Float32Array(N * 3)
        const highlighted = new Float32Array(N)
        state.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        state.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        state.geometry.setAttribute('isHighlighted', new THREE.BufferAttribute(highlighted, 1))
      }

      const highlightedAttr = state.geometry.getAttribute('isHighlighted')
      const highlighted = highlightedAttr.array

      const themeVal = theme.value
      const gradient = redshiftGradient.value
      const showGradient = showRedshiftGradient.value
      const minRed = minRedshift.value
      const maxRed = maxRedshift.value
      const rangeInv = (maxRed - minRed) > 1e-9 ? 1.0 / (maxRed - minRed) : 0

      const pointR = themeVal.point.r
      const pointG = themeVal.point.g
      const pointB = themeVal.point.b
      const selR = themeVal.selectedPoint.r
      const selG = themeVal.selectedPoint.g
      const selB = themeVal.selectedPoint.b

      // Fast path for Zero-Copy
      if (isZeroCopy) {
        for (let i = 0; i < N; i++) {
          const offset = t[i].offset
          let x, y
          if (state.mode === state.SKY_MODE) {
            x = float64View[offset + OFFSET_RA]
            y = float64View[offset + OFFSET_DEC]
          } else {
            x = float64View[offset + OFFSET_PROJ_X]
            y = float64View[offset + OFFSET_PROJ_Y]
          }

          positions[3 * i + 0] = isNaN(x) ? 0 : x
          positions[3 * i + 1] = isNaN(y) ? 0 : y
          positions[3 * i + 2] = 0.1

          const selected = t[i].isSelected()

          if (selected) {
            colors[3 * i + 0] = selR
            colors[3 * i + 1] = selG
            colors[3 * i + 2] = selB
          } else {
            if (showGradient) {
              let val = (t[i].getRedshift() - minRed) * rangeInv
              if (val < 0) val = 0
              if (val > 1) val = 1
              const lutIdx = (val * 255) | 0
              const lutOffset = lutIdx * 3
              colors[3 * i + 0] = gradient[lutOffset]
              colors[3 * i + 1] = gradient[lutOffset + 1]
              colors[3 * i + 2] = gradient[lutOffset + 2]
            } else {
              colors[3 * i + 0] = pointR
              colors[3 * i + 1] = pointG
              colors[3 * i + 2] = pointB
            }
          }

          highlighted[i] = selected ? 1.0 : 0.0
        }
      } else {
        // Fallback path (Object Mode)
        for (let i = 0; i < N; i++) {
          const ti = t[i]
          let x, y
          if (state.mode === state.SKY_MODE) {
            x = ti.getAscension()
            y = ti.getDeclination()
          } else {
            x = ti.getx ? ti.getx() : 0
            y = ti.gety ? ti.gety() : 0
          }

          positions[3 * i + 0] = isNaN(x) ? 0 : x
          positions[3 * i + 1] = isNaN(y) ? 0 : y
          positions[3 * i + 2] = 0.1

          const selected = ti.isSelected ? ti.isSelected() : false
          if (selected) {
            colors[3 * i + 0] = selR
            colors[3 * i + 1] = selG
            colors[3 * i + 2] = selB
          } else {
            if (showGradient) {
              let val = (ti.getRedshift() - minRed) * rangeInv
              if (val < 0) val = 0
              if (val > 1) val = 1
              const lutIdx = (val * 255) | 0
              const lutOffset = lutIdx * 3
              colors[3 * i + 0] = gradient[lutOffset]
              colors[3 * i + 1] = gradient[lutOffset + 1]
              colors[3 * i + 2] = gradient[lutOffset + 2]
            } else {
              colors[3 * i + 0] = pointR
              colors[3 * i + 1] = pointG
              colors[3 * i + 2] = pointB
            }
          }

          highlighted[i] = selected ? 1.0 : 0.0
        }
      }

      state.geometry.attributes.position.needsUpdate = true
      state.geometry.attributes.color.needsUpdate = true
      state.geometry.attributes.isHighlighted.needsUpdate = true
      state.geometry.computeBoundingSphere()
    }

    function drawReferenceMarks() {
      if (constraintError.value) { return } // Exit early if constraint error is active
      while (state.refGroup.children.length) state.refGroup.remove(state.refGroup.children[0])
      if (!showRefMarks.value) return
      if (!Number.isFinite(horizonAngularDistance.value)) return
      const shapePts = []
      if (state.mode === state.UNIVERSE_MODE) {
        if (view.value > 3) {
          // Front views
          const step = Math.PI / 100
          let radius
          if (comovingSpaceFlag.value === false) {
            // Reference space
            if (kappa.value > 0) {
              // Spherical - cap at PI/2 to avoid sin() oscillation
              const chi = Math.min(horizonAngularDistance.value, Math.PI / 2)
              radius = Math.sin(chi)
            } else if (kappa.value < 0) {
              // Hyperbolic
              radius = Math.sinh(horizonAngularDistance.value)
            } else {
              // Flat
              radius = horizonAngularDistance.value
            }
          } else {
            // Comoving space
            if (kappa.value > 0) {
              // Spherical - cap at PI/2 to avoid sin() oscillation
              const chi = Math.min(horizonAngularDistance.value, Math.PI / 2)
              radius = Math.sin(chi) / Math.sqrt(kappa.value)
            } else if (kappa.value < 0) {
              // Hyperbolic
              radius = Math.sinh(horizonAngularDistance.value) / Math.sqrt(-kappa.value)
            } else {
              // Flat
              radius = horizonAngularDistance.value
            }
          }
          for (let ang = 0; ang <= Math.PI * 2 + step; ang += step) {
            const cx = Math.sin(ang) * radius
            const cy = Math.cos(ang) * radius
            shapePts.push(new THREE.Vector3(cx, cy, 0))
          }
        } else {
          // Edge views
          const step = Math.PI / 100
          // Use the actual horizon distance as the limit
          const maxDist = horizonAngularDistance.value
          // Calculate Y-scale factor for comoving space
          let yScale
          if (comovingSpaceFlag.value === false) {
            yScale = 1.0
          } else {
            if (kappa.value !== 0) {
              yScale = 1.0 / Math.sqrt(Math.abs(kappa.value))
            }
          }
          const shift = comovingSpaceFlag.value ? 1.0 : 0.0
          for (let dist = 0; dist <= maxDist; dist += step) {
            let cx, cy
            if (kappa.value > 0) {
              // Spherical
              // Earth is at (1,0) in projection (u0 axis).
              // u0 = cos(chi), ui = sin(chi)
              cx = (Math.cos(dist) - shift) * yScale // Horizontal axis (Time/Radial)
              cy = Math.sin(dist) * yScale // Vertical axis (Transverse)
            } else if (kappa.value < 0) {
              // Hyperbolic
              // Earth is at (1,0). u0 = cosh(chi), ui = sinh(chi)
              cx = (Math.cosh(dist) - shift) * yScale
              cy = Math.sinh(dist) * yScale // Vertical axis (Transverse)
            } else {
              // Flat
              cx = 0
              cy = dist
            }
            shapePts.push(new THREE.Vector3(cx, cy, 0))
          }
          // Mirror the shape for visual completeness (+/- y)
          for (let i = shapePts.length - 1; i >= 0; i--) {
            const p = shapePts[i]
            shapePts.push(new THREE.Vector3(p.x, -p.y, 0))
          }
        }
        // Create outline
        const geom = new THREE.BufferGeometry().setFromPoints(shapePts)
        const outlineMat = new THREE.LineBasicMaterial({
          color: theme.value.markOutline,
        })
        state.refGroup.add(new THREE.Line(geom, outlineMat))
        // Create filled area
        const shape = new THREE.Shape()
        if (shapePts.length > 0) {
          shape.moveTo(shapePts[0].x, shapePts[0].y)
          for (let i = 1; i < shapePts.length; i++) {
            shape.lineTo(shapePts[i].x, shapePts[i].y)
          }
          shape.closePath()
          const shapeGeom = new THREE.ShapeGeometry(shape)
          const areaMat = new THREE.MeshBasicMaterial({
            color: theme.value.horizonBackground,
          })
          state.refGroup.add(new THREE.Mesh(shapeGeom, areaMat))
        }
      } else {
        // SKY_MODE
        const mat = new THREE.LineBasicMaterial({ color: theme.value.markOutline })
        // Create outline
        const borderPts = []
        borderPts.push(new THREE.Vector3(0, -Math.PI / 2, 0))
        borderPts.push(new THREE.Vector3(0, Math.PI / 2, 0))
        borderPts.push(new THREE.Vector3(2 * Math.PI, Math.PI / 2, 0))
        borderPts.push(new THREE.Vector3(2 * Math.PI, -Math.PI / 2, 0))
        borderPts.push(new THREE.Vector3(0, -Math.PI / 2, 0))
        const geomBorder = new THREE.BufferGeometry().setFromPoints(borderPts)
        state.refGroup.add(new THREE.Line(geomBorder, mat))
        // Create filled area
        const shape = new THREE.Shape()
        shape.moveTo(borderPts[0].x, borderPts[0].y)
        for (let i = 1; i < borderPts.length; i++) {
          shape.lineTo(borderPts[i].x, borderPts[i].y)
        }
        shape.closePath()
        const shapeGeom = new THREE.ShapeGeometry(shape)
        const areaMat = new THREE.MeshBasicMaterial({
          color: theme.value.horizonBackground,
        })
        state.refGroup.add(new THREE.Mesh(shapeGeom, areaMat))
        // Create X axis
        const xPts = []
        const zOffset = 0.01
        xPts.push(new THREE.Vector3(0, 0, zOffset))
        xPts.push(new THREE.Vector3(2 * Math.PI, 0, zOffset))
        const geomX = new THREE.BufferGeometry().setFromPoints(xPts)
        state.refGroup.add(new THREE.Line(geomX, mat))
      }
    }

    function render() {
      if (!state.renderer) return
      updateCameraBounds()
      state.renderer.render(state.scene, state.camera)
    }

    function clearCanvasContent() {
      // Clear points
      if (state.geometry) {
        state.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
        state.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 3))
        state.geometry.setAttribute('isHighlighted', new THREE.Float32BufferAttribute([], 1))
        state.geometry.attributes.position.needsUpdate = true
        state.geometry.attributes.color.needsUpdate = true
        state.geometry.attributes.isHighlighted.needsUpdate = true
      }
      // Clear reference marks
      if (state.refGroup) {
        while (state.refGroup.children.length) {
          const child = state.refGroup.children[0]
          state.refGroup.remove(child)
          if (child.geometry) child.geometry.dispose()
          if (child.material) child.material.dispose()
        }
      }
      render() // Render empty scene
    }

    function updateCanvas() {
      if (constraintError.value) { // If there's an error, don't update with data
        clearCanvasContent() // Ensure canvas is empty
        return
      }
      populatePoints()
      drawReferenceMarks()
      render()
    }

    watch(constraintError, (newError) => {
      if (newError) {
        clearCanvasContent()
      } else {
        updateCanvas() // Re-draw content if error is cleared
      }
    })

    function onWheel(e) {
      e.preventDefault()
      const delta = e.deltaY || e.delta
      state.zoom += (-delta / 500.0) * state.zoom
      if (state.zoom < 1e-4) state.zoom = 1e-4
      state.mouseX = e.clientX
      state.mouseY = e.clientY
      state.zoomChanged = true
      const before = pixelToWorld(e.clientX, e.clientY)
      updateCameraBounds()
      const after = pixelToWorld(e.clientX, e.clientY)
      state.posX += before.worldX - after.worldX
      state.posY += before.worldY - after.worldY
      render()
    }

    function onContextMenu(e) {
      e.preventDefault()
    }

    function onMouseDown(e) {
      if (e.button === 0) {
        if (mouseMode.value === 'move') {
          // Drag view
          state.isDragging = true
          state.mouseX = e.clientX
          state.mouseY = e.clientY
        } else if (mouseMode.value === 'select') {
          // Select
          const { pixelX, pixelY } = pixelToWorld(e.clientX, e.clientY)
          state.selectX1 = pixelX
          state.selectY1 = pixelY
          state.selectX2 = pixelX
          state.selectY2 = pixelY
          state.isSelecting = true
        }
      }
    }

    function resetView() {
      setMode(state.mode)
    }

    function highlightSelection() {
      const duration = 1000 // 1 second
      const startScale = 10.0
      const endScale = 1.0
      const startTime = performance.now()

      function animate(currentTime) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1.0)

        // Linear reduction from 10x to 1x
        state.highlightScale = startScale + (endScale - startScale) * progress

        if (state.material && state.material.userData.shader) {
          state.material.userData.shader.uniforms.uHighlightScale.value = state.highlightScale
        }

        render()

        if (progress < 1.0) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }

    function clearSelection() {
      const t = activeTargets.value || []
      t.forEach((ti) => {
        if (ti.setSelected) ti.setSelected(false)
      })
      catalogStore.setSelectedTargets([])
      updatePointsColor()
      render()
    }

    expose({ resetView, highlightSelection, clearSelection })

    function onMouseMove(e) {
      const rect = root.value.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      state.selectX2 = localX
      state.selectY2 = localY

      // Update world coordinates for display
      const worldCoords = pixelToWorld(e.clientX, e.clientY)
      let { worldX: x, worldY: y } = worldCoords

      if (state.mode === state.SKY_MODE) {
        if (x < 0 || x > 2 * Math.PI || y < -Math.PI / 2 || y > Math.PI / 2) {
          x = null
          y = null
        }
      }

      emit('update-mouse-coords', { x, y })

      if (state.isSelecting) {
        render()
      } else if (state.isDragging) {
        const prev = pixelToWorld(state.mouseX, state.mouseY)
        const curr = worldCoords
        const offsetX = prev.worldX - curr.worldX
        const offsetY = prev.worldY - curr.worldY
        state.posX += offsetX
        state.posY += offsetY
        state.mouseX = e.clientX
        state.mouseY = e.clientY
        render()
      }
    }

    function onMouseUp(e) {
      state.isDragging = false
      if (e.button !== 0) return
      if (!state.isSelecting) return

      statusStore.runBusyTask(() => {
        const rect = root.value.getBoundingClientRect()
        const p1 = pixelToWorld(rect.left + state.selectX1, rect.top + state.selectY1)
        const p2 = pixelToWorld(rect.left + state.selectX2, rect.top + state.selectY2)

        // Calculate pixel-space dimensions of the selection
        const pixelWidth = Math.abs(state.selectX2 - state.selectX1)
        const pixelHeight = Math.abs(state.selectY2 - state.selectY1)
        const isClick = pixelWidth < 5 && pixelHeight < 5

        let selX1, selX2, selY1, selY2
        let nearestTarget = null

        if (isClick) {
          // Find the nearest target within a small threshold
          const clickThresholdWorld = 0.03 / state.zoom // Small threshold in world coordinates
          const clickX = p1.worldX
          const clickY = p1.worldY

          const t = activeTargets.value || []
          let minDistance = clickThresholdWorld

          for (let i = 0; i < t.length; i++) {
            const ti = t[i]
            let x, y
            if (state.mode === state.UNIVERSE_MODE) {
              x = ti.getx()
              y = ti.gety()
            } else {
              x = ti.getAscension()
              y = ti.getDeclination()
            }

            const distance = Math.sqrt(Math.pow(x - clickX, 2) + Math.pow(y - clickY, 2))

            if (distance <= minDistance) {
              minDistance = distance
              nearestTarget = ti
            }
          }
        } else {
          // Regular rectangle selection
          selX1 = Math.min(p1.worldX, p2.worldX)
          selX2 = Math.max(p1.worldX, p2.worldX)
          selY1 = Math.min(p1.worldY, p2.worldY)
          selY2 = Math.max(p1.worldY, p2.worldY)
        }

        const t = activeTargets.value || []
        const selectedRefs = []

        // Pre-capture selected state for intersection mode
        const previouslySelected = new Set()
        if (state.selectionType === 'intersection') {
          t.forEach((ti) => {
            if (ti.isSelected()) {
              previouslySelected.add(ti)
            }
          })
        }

        // Initial deselection for 'replace' and 'intersection' modes
        if (state.selectionType === 'replace' || state.selectionType === 'intersection') {
          t.forEach((ti) => ti.setSelected(false))
        }

        if (isClick && nearestTarget) {
          // Select only the nearest target
          switch (state.selectionType) {
            case 'additive':
              nearestTarget.setSelected(true)
              break
            case 'replace':
              nearestTarget.setSelected(true)
              break
            case 'intersection':
              if (previouslySelected.has(nearestTarget)) {
                nearestTarget.setSelected(true)
              }
              break
          }
          // Collect all selected targets
          for (let i = 0; i < t.length; i++) {
            if (t[i].isSelected()) {
              selectedRefs.push(t[i])
            }
          }
        } else {
          // Rectangle selection (including clicks with no nearby target)
          for (let i = 0; i < t.length; i++) {
            const ti = t[i]
            let x, y
            if (state.mode === state.UNIVERSE_MODE) {
              x = ti.getx()
              y = ti.gety()
            } else {
              const asc = ti.getAscension()
              const dec = ti.getDeclination()
              x = asc
              y = dec
            }

            const isInsideRectangle = x > selX1 && x < selX2 && y > selY1 && y < selY2

            switch (state.selectionType) {
              case 'additive':
                if (isInsideRectangle) {
                  ti.setSelected(true)
                }
                break
              case 'replace':
                if (isInsideRectangle) {
                  ti.setSelected(true)
                }
                break
              case 'intersection':
                if (isInsideRectangle && previouslySelected.has(ti)) {
                  ti.setSelected(true)
                }
                break
            }

            if (ti.isSelected()) {
              selectedRefs.push(ti)
            }
          }
        }

        catalogStore.setSelectedTargets(selectedRefs)

        state.isSelecting = false

        updatePointsColor()
        render()
      })
    }

    function handlePressedKeys() {
      if (state.shiftKeyPressed) {
        state.selectionType = 'additive'
      } else if (state.ctrlKeyPressed) {
        state.selectionType = 'intersection'
      } else {
        state.selectionType = 'replace'
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Shift') {
        state.shiftKeyPressed = true
      } else if (e.key === 'Control') {
        state.ctrlKeyPressed = true
      } else if (e.key === 'Alt') {
        state.altKeyPressed = true
      }
      handlePressedKeys()
    }

    watch(activeTargets, (newT) => {
      // When switching between subset and full set
      if (newT === targets.value) {
        recomputeAll()
      } else {
        updateCanvas()
      }
    })

    function onKeyUp(e) {
      if (e.key === 'Shift') {
        state.shiftKeyPressed = false
      } else if (e.key === 'Control') {
        state.ctrlKeyPressed = false
      } else if (e.key === 'Alt') {
        state.altKeyPressed = false
      }
      handlePressedKeys()
    }

    onMounted(() => {
      initThree()
      const dom = root.value
      dom.addEventListener('wheel', onWheel, { passive: false })
      dom.addEventListener('contextmenu', onContextMenu)
      dom.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      window.addEventListener('keyup', onKeyUp)
      window.addEventListener('keydown', onKeyDown)

      resizeObserver = new ResizeObserver(() => onResize())
      if (root.value) {
        resizeObserver.observe(root.value)
      }

      universeStore.setViewerCanvas({
        updateCanvas,
        highlightSelection,
        setShowReferencesMarks: (s) => {
          state.showReferencesMarks = !!s
          drawReferenceMarks()
          render()
        },
      })
    })

    onBeforeUnmount(() => {
      const dom = root.value
      if (dom) {
        dom.removeEventListener('wheel', onWheel)
        dom.removeEventListener('contextmenu', onContextMenu)
        dom.removeEventListener('mousedown', onMouseDown)
      }
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('keydown', onKeyDown)

      if (resizeObserver) {
        resizeObserver.disconnect()
      }

      if (state.renderer) {
        state.renderer.dispose()
        if (state.renderer.domElement && state.renderer.domElement.parentNode) {
          state.renderer.domElement.parentNode.removeChild(state.renderer.domElement)
        }
        state.renderer = null
      }
    })

    return {
      root,
      overlay,
      selectionStyle,
      isSelecting: computed(() => state.isSelecting),
      modeName,
      targets,
      updateCanvas,
      busy,
      isVueImmediateRefreshEnabled,
      isInteracting,
      mouseMode,
      themeName,
      redshiftGradient,
      constraintError,
      gradientStyle,
      showRedshiftGradient,
      minRedshift,
      maxRedshift,
    }
  },
}
</script>

<style scoped>
.viewer-root {
  position: relative;
  width: 100%;
  height: 100%;
  background: black;
  overflow: hidden;
}
.viewer-root.move {
  cursor: all-scroll;
}
.viewer-root.select {
  cursor: crosshair;
}
.viewer-root.constraint-error {
  cursor: not-allowed !important;
}
.overlay {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  transition: backdrop-filter 0.5s;
  transition-delay: 0s;
  backdrop-filter: blur(0px);
}
.busy .overlay {
  transition-delay: 0.5s;
  backdrop-filter: blur(6px);
}
.selection-rect {
  box-sizing: border-box;
  position: absolute;
  border: 2px solid #aaaaaa;
  background: rgba(255, 255, 255, 0.08);
  pointer-events: none;
  z-index: 10;
}
.hud {
  position: absolute;
  left: 6px;
  top: 6px;
  color: white;
  font-size: 13px;
  z-index: 5;
  pointer-events: none;
}
.hud.light {
  color: black;
}

.error-message-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  pointer-events: none;
}

.error-message-box {
  border: 1px solid red;
  color: red;
  padding: 20px;
  text-align: center;
  max-width: 60%;
  pointer-events: all; /* Make box interactive to prevent interaction with canvas beneath */
}

.error-message-title {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 10px;
}

.error-message-details {
  white-space: pre-wrap; /* Preserve newlines and spaces */
  font-family: monospace;
  font-size: 1.1em;
}

.redshift-legend {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  pointer-events: none;
}
.redshift-legend .v-sheet {
  pointer-events: auto;
}
</style>
