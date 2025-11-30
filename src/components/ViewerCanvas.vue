<template>
  <div ref="root" class="viewer-root" style="position: relative; width: 100%; height: 100%">
    <!-- Three.js canvas will be appended here -->
    <div
      ref="overlay"
      class="overlay"
      style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; pointer-events: none"
    ></div>

    <!-- Selection rectangle (HTML overlay) -->
    <div v-show="isSelecting" :style="selectionStyle" class="selection-rect"></div>

    <!-- HUD (mode, points count) -->
    <div class="hud">
      <div>{{ modeName }}</div>
    </div>
  </div>
</template>

<script>
import { onMounted, onBeforeUnmount, ref, reactive, computed, markRaw } from 'vue'
import { storeToRefs } from 'pinia'
import * as THREE from 'three'
import { useUniverseStore, UPDATE_VIEWER } from '@/stores/universe.js'
import { watch } from 'vue'

export default {
  name: 'ViewerCanvas',
  setup() {
    const root = ref(null)
    const overlay = ref(null)

    const store = useUniverseStore()
    const {
      quasars,
      kappa,
      view,
      ascension_max,
      pointSize,
      comovingSpaceFlag,
      horizonAngularDistance,
    } = storeToRefs(store)

    const state = reactive({
      zoom: 1.0,
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
      showReferencesMarks: true,
      renderer: null,
      scene: null,
      camera: null,
      points: null,
      geometry: null,
      material: null,
      refGroup: null,
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
      store.update(UPDATE_VIEWER)
    }

    function setMode(m) {
      if (m === state.UNIVERSE_MODE) {
        state.xMin = -1
        state.yMin = -1
        state.xMax = 1
        state.yMax = 1
        state.posX = 0 // Center of -1 to 1
        state.posY = 0 // Center of -1 to 1
      } else if (m === state.SKY_MODE) {
        state.xMin = 0
        state.yMin = -Math.PI / 2
        state.xMax = 2 * Math.PI
        state.yMax = Math.PI / 2
        state.posX = Math.PI // Center of 0 to 2*PI
        state.posY = 0 // Center of -Math.PI/2 to Math.PI/2
      } else {
        return
      }
      state.zoom = 1
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

    function initThree() {
      const width = root.value.clientWidth
      const height = root.value.clientHeight

      state.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true }))
      state.renderer.setSize(width, height)
      state.renderer.setPixelRatio(window.devicePixelRatio || 1)
      root.value.appendChild(state.renderer.domElement)

      state.scene = markRaw(new THREE.Scene())
      state.scene.background = new THREE.Color(0x000000)
      state.camera = markRaw(createOrthoCamera())
      onResize() // Set initial camera projection based on current size

      state.geometry = markRaw(new THREE.BufferGeometry())
      state.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
      state.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 3))

      state.material = markRaw(
        new THREE.PointsMaterial({
          size: pointSize.value,
          vertexColors: true,
          sizeAttenuation: false,
        }),
      )

      state.points = markRaw(new THREE.Points(state.geometry, state.material))
      state.scene.add(state.points)

      state.refGroup = markRaw(new THREE.Group())
      state.scene.add(state.refGroup)

      drawReferenceMarks()
      populatePoints()
      render()
    }

    watch(pointSize, (newValue) => {
      if (state.material) {
        state.material.size = newValue
        render()
      }
    })

    function populatePoints() {
      const q = quasars.value || []
      const N = q.length
      if (N === 0) return
      const positions = new Float32Array(N * 3)
      const colors = new Float32Array(N * 3)

      for (let i = 0; i < N; i++) {
        const qi = q[i]
        let x, y
        if (state.mode === state.SKY_MODE) {
          x = qi.getAscension()
          y = qi.getDeclination()
        } else {
          x = qi.getx ? qi.getx() : 0
          y = qi.gety ? qi.gety() : 0
        }

        positions[3 * i + 0] = x
        positions[3 * i + 1] = y
        positions[3 * i + 2] = 0.1

        const selected = qi.isSelected ? qi.isSelected() : false
        if (selected) {
          colors[3 * i + 0] = 0.0
          colors[3 * i + 1] = 1.0
          colors[3 * i + 2] = 0.0
        } else {
          colors[3 * i + 0] = 1.0
          colors[3 * i + 1] = 1.0
          colors[3 * i + 2] = 1.0
        }
      }

      state.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      state.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      state.geometry.attributes.position.needsUpdate = true
      state.geometry.attributes.color.needsUpdate = true
      state.geometry.computeBoundingSphere()
    }

    function drawReferenceMarks() {
      while (state.refGroup.children.length) state.refGroup.remove(state.refGroup.children[0])
      if (!state.showReferencesMarks) return
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
          for (let dist = 0; dist <= maxDist; dist += step) {
            let cx, cy
            if (kappa.value > 0) {
              // Spherical
              // Earth is at (1,0) in projection (u0 axis).
              // u0 = cos(chi), ui = sin(chi)
              cx = Math.cos(dist) // Horizontal axis (Time/Radial)
              cy = Math.sin(dist) * yScale // Vertical axis (Transverse)
            } else if (kappa.value < 0) {
              // Hyperbolic
              // Earth is at (1,0). u0 = cosh(chi), ui = sinh(chi)
              cx = Math.cosh(dist)
              cy = Math.sinh(dist) * yScale
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
        const outlineMat = new THREE.LineBasicMaterial({ color: 0xaaaaaa })
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
          const areaMat = new THREE.MeshBasicMaterial({ color: 0x000030 })
          state.refGroup.add(new THREE.Mesh(shapeGeom, areaMat))
        }
      } else {
        // SKY_MODE
        const mat = new THREE.LineBasicMaterial({ color: 0xaaaaaa })
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
        const areaMat = new THREE.MeshBasicMaterial({ color: 0x000030 })
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

    function updateCanvas() {
      populatePoints()
      drawReferenceMarks()
      render()
    }

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
      updateCanvas()
    }

    function onContextMenu(e) {
      e.preventDefault()
    }

    function onMouseDown(e) {
      if ((e.button === 0 && state.altKeyPressed) || e.button === 2) {
        // Drag view
        state.isDragging = true
        state.mouseX = e.clientX
        state.mouseY = e.clientY
      } else if (e.button === 0) {
        // Select
        const { pixelX, pixelY } = pixelToWorld(e.clientX, e.clientY)
        state.selectX1 = pixelX
        state.selectY1 = pixelY
        state.selectX2 = pixelX
        state.selectY2 = pixelY
        state.isSelecting = true
      } else if (e.button === 1) {
        // Reset view
        setMode(state.mode)
        updateCanvas()
        return
      }
    }

    function onMouseMove(e) {
      const rect = root.value.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      state.selectX2 = localX
      state.selectY2 = localY

      if (state.isSelecting) {
        render()
      } else if (state.isDragging) {
        const prev = pixelToWorld(state.mouseX, state.mouseY)
        const curr = pixelToWorld(e.clientX, e.clientY)
        const offsetX = prev.worldX - curr.worldX
        const offsetY = prev.worldY - curr.worldY
        state.posX += offsetX
        state.posY += offsetY
        state.mouseX = e.clientX
        state.mouseY = e.clientY
        updateCanvas()
      }
    }

    function onMouseUp(e) {
      state.isDragging = false
      if (e.button !== 0) return
      if (!state.isSelecting) return

      const rect = root.value.getBoundingClientRect()
      const p1 = pixelToWorld(rect.left + state.selectX1, rect.top + state.selectY1)
      const p2 = pixelToWorld(rect.left + state.selectX2, rect.top + state.selectY2)

      let selX1 = Math.min(p1.worldX, p2.worldX)
      let selX2 = Math.max(p1.worldX, p2.worldX)
      let selY1 = Math.min(p1.worldY, p2.worldY)
      let selY2 = Math.max(p1.worldY, p2.worldY)

      if (state.mode === state.UNIVERSE_MODE && kappa.value < 0 && view.value <= 3) {
        selX1 += 2
        selX2 += 2
      }

      const q = quasars.value || []
      let nbSelected = 0

      // Pre-capture selected state for intersection mode
      const previouslySelected = new Set()
      if (state.selectionType === 'intersection') {
        q.forEach((qi) => {
          if (qi.isSelected()) {
            previouslySelected.add(qi)
          }
        })
      }

      // Initial deselection for 'replace' and 'intersection' modes
      // For 'additive', existing selections outside the new rectangle remain selected.
      if (state.selectionType === 'replace' || state.selectionType === 'intersection') {
        q.forEach((qi) => qi.setSelected(false))
      }

      for (let i = 0; i < q.length; i++) {
        const qi = q[i]
        let x, y
        if (state.mode === state.UNIVERSE_MODE) {
          x = qi.getx()
          y = qi.gety()
        } else {
          const asc = qi.getAscension()
          const dec = qi.getDeclination()
          x = asc
          y = dec
        }

        const isInsideRectangle = x > selX1 && x < selX2 && y > selY1 && y < selY2

        switch (state.selectionType) {
          case 'additive':
            if (isInsideRectangle) {
              qi.setSelected(true)
            }
            // If not inside, its state remains unchanged (additive)
            break
          case 'replace':
            if (isInsideRectangle) {
              qi.setSelected(true)
            }
            // If not inside, it was already deselected above
            break
          case 'intersection':
            if (isInsideRectangle && previouslySelected.has(qi)) {
              qi.setSelected(true)
            }
            // If not inside or not previously selected, it was already deselected above
            break
        }

        if (qi.isSelected()) {
          nbSelected += 1
        }
      }

      store.setSelectedCount(nbSelected)

      state.isSelecting = false

      updateCanvas()
      if (store.mainWin && typeof store.mainWin.updateSelection === 'function') {
        store.mainWin.updateSelection()
      }
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
      if (event.key === 'Shift') {
        state.shiftKeyPressed = true
      } else if (event.key === 'Control') {
        state.ctrlKeyPressed = true
      } else if (event.key === 'Alt') {
        state.altKeyPressed = true
      }
      handlePressedKeys()
    }

    function onKeyUp(e) {
      if (event.key === 'Shift') {
        state.shiftKeyPressed = false
      } else if (event.key === 'Control') {
        state.ctrlKeyPressed = false
      } else if (event.key === 'Alt') {
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

      store.setViewerCanvas({
        updateCanvas,
        setMode: (m) => {
          setMode(m)
          updateCanvas()
        },
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
      quasars,
      updateCanvas,
      setModePublic: (m) => {
        setMode(m)
        updateCanvas()
      },
      setShowReferencesMarksPublic: (s) => {
        state.showReferencesMarks = !!s
        drawReferenceMarks()
        render()
      },
    }
  },
}
</script>

<style scoped>
.viewer-root {
  background: black;
  overflow: hidden;
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
</style>
