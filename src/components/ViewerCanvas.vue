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
      <div>Mode: {{ modeName }}</div>
      <div>Quasars: {{ quasarsCount }}</div>
    </div>
  </div>
</template>

<script>
/**
  Viewer canvas using Three.js
  - Exposes updateCanvas() method, called by Environment.update()
  - Calls Environment.setOpenGLViewerCanvas() on mount
  - Implements controls: zoom (wheel), pan (drag), selection rectangle (left mouse), reset on right-click
  - Handles "sky" and "universe" modes, hud and reference marks
*/

import { onMounted, onBeforeUnmount, ref, reactive, computed, markRaw } from 'vue'
import * as THREE from 'three'
import * as Environment from '@/logic/environment.js'
import Quasar from '@/logic/quasar.js'

export default {
  name: 'ViewerCanvas',
  setup() {
    const root = ref(null)
    const overlay = ref(null)

    const state = reactive({
      // canvas logical size (for internal mapping)
      SIZE_X: 500,
      SIZE_Y: 500,

      // zoom / pan
      zoom: 1.0,
      zoomChanged: false,
      posX: 0.0,
      posY: 0.0,

      // canvas world bounds
      xMin: -1,
      yMin: -1,
      xMax: 1,
      yMax: 1,

      // selection
      selecting: false,
      selectionEnabled: false,
      selectX1: 0,
      selectY1: 0,
      selectX2: 0,
      selectY2: 0,
      isSelecting: false,

      // mouse
      mouseX: 0,
      mouseY: 0,

      // viewing mode (0 = UNIVERSE, 1 = SKY)
      mode: 0,
      SKY_MODE: 1,
      UNIVERSE_MODE: 0,

      showReferencesMarks: true,

      // three.js essentials
      renderer: null,
      scene: null,
      camera: null,
      points: null,
      geometry: null,
      material: null,
      refGroup: null,
    })

    // quasars count for HUD
    const quasarsCount = ref(0)

    // computed helpers
    const modeName = computed(() => (state.mode === state.UNIVERSE_MODE ? 'universe' : 'sky'))

    // selection rectangle style for HTML overlay
    const selectionStyle = computed(() => {
      // convert selection screen coords to top-left/width/height
      const x = Math.min(state.selectX1, state.selectX2)
      const y = Math.min(state.selectY1, state.selectY2)
      const w = Math.abs(state.selectX2 - state.selectX1)
      const h = Math.abs(state.selectY2 - state.selectY1)
      return {
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${w}px`,
        height: `${h}px`,
        border: '2px solid rgba(0,255,0,0.9)',
        background: 'rgba(0,255,0,0.08)',
        pointerEvents: 'none',
        zIndex: 10,
      }
    })

    // World <-> Screen helpers
    function setMode(m) {
      console.log('ViewerCanvas: setMode called with', m)
      if (m === state.UNIVERSE_MODE) {
        state.xMin = -1
        state.yMin = -1
        state.xMax = 1
        state.yMax = 1
        state.posX = 0
        state.posY = 0
      } else if (m === state.SKY_MODE) {
        state.xMin = 0
        state.yMin = -Math.PI / 2
        state.xMax = 2 * Math.PI
        state.yMax = Math.PI / 2
        state.posX = 0
        state.posY = 0
      } else {
        console.warn('ViewerCanvas: invalid mode', m)
        return
      }
      state.zoom = 1
      state.mode = m
      updateCameraBounds()
    }

    // Map mouse pixel -> world X/Y
    function pixelToWorld(clientX, clientY) {
      const rect = root.value.getBoundingClientRect()
      const localX = clientX - rect.left
      const localY = clientY - rect.top
      // map to -1..1 normalized inside current view
      const u = (2.0 * localX - rect.width) / rect.width
      const v = -(2.0 * localY - rect.height) / rect.height

      // Center of the view in world coords
      const cx = (state.xMax + state.xMin) / 2.0 + state.posX
      const cy = (state.yMax + state.yMin) / 2.0 + state.posY

      // Half-span of the view in world coords (adjusted by zoom)
      const spanX = (state.xMax - state.xMin) / 2.0 / state.zoom
      const spanY = (state.yMax - state.yMin) / 2.0 / state.zoom

      const worldX = cx + u * spanX
      const worldY = cy + v * spanY

      return { worldX, worldY, pixelX: localX, pixelY: localY }
    }

    // Update orthographic camera to match world bounds and zoom/pan
    function createOrthoCamera() {
      // We'll set camera so that its left/right/top/bottom match world coordinates
      const left = state.xMin + state.posX
      const right = state.xMax + state.posX
      const bottom = state.yMin + state.posY
      const top = state.yMax + state.posY
      const near = -1000
      const far = 1000

      const cam = new THREE.OrthographicCamera(left, right, top, bottom, near, far)
      cam.zoom = state.zoom
      cam.updateProjectionMatrix()
      cam.position.set(0, 0, 10)
      cam.lookAt(0, 0, 0)
      return cam
    }

    // Camera left/right/top/bottom adjusted by zoom and pos
    function updateCameraBounds() {
      if (!state.camera) return
      // We'll recreate camera projection extents based on world bounds and pos
      const left = state.xMin + state.posX
      const right = state.xMax + state.posX
      const bottom = state.yMin + state.posY
      const top = state.yMax + state.posY
      state.camera.left = left
      state.camera.right = right
      state.camera.top = top
      state.camera.bottom = bottom
      state.camera.zoom = state.zoom
      state.camera.updateProjectionMatrix()
    }

    // Three.js scene & points management
    function initThree() {
      const width = root.value.clientWidth || state.SIZE_X
      const height = root.value.clientHeight || state.SIZE_Y

      // Renderer
      state.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true }))
      state.renderer.setSize(width, height)
      state.renderer.setPixelRatio(window.devicePixelRatio || 1)
      // Append canvas
      root.value.appendChild(state.renderer.domElement)

      // Overlay for reference marks (2D lines) - we will draw using THREE Line objects in the scene
      state.scene = markRaw(new THREE.Scene())

      // Camera
      state.camera = markRaw(createOrthoCamera(width, height))

      // Point geometry (initially empty)
      state.geometry = markRaw(new THREE.BufferGeometry())
      // Initial empty attributes
      state.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3))
      state.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 3))

      state.material = markRaw(
        new THREE.PointsMaterial({
          size: 2.0, // pixels if sizeAttenuation is false
          vertexColors: true,
          sizeAttenuation: false, // keep constant size in screen space (we control with size and zoom)
        }),
      )

      state.points = markRaw(new THREE.Points(state.geometry, state.material))
      state.scene.add(state.points)

      // Reference marks containers
      state.refGroup = markRaw(new THREE.Group())
      state.scene.add(state.refGroup)

      // Initial draw
      drawReferenceMarks()
      populatePoints()
      render()
    }

    // Convert Quasar list -> positions/colors buffer
    function populatePoints() {
      const q = Environment.getQuasars() || []
      const N = q.length
      const positions = new Float32Array(N * 3) // x,y,z
      const colors = new Float32Array(N * 3)

      // Iterate and fill based on quasar.getx/gety
      for (let i = 0; i < N; i++) {
        const qi = q[i]
        // If pos not set, skip (0,0)
        let x, y
        if (state.mode === state.SKY_MODE) {
          x = qi.getAscension()
          y = qi.getDeclination()
        } else {
          x = qi.getx ? qi.getx() : 0
          y = qi.gety ? qi.gety() : 0
        }

        if (i === 0) {
          console.log('ViewerCanvas: First quasar pos:', x, y)
        }

        positions[3 * i + 0] = x
        positions[3 * i + 1] = y
        positions[3 * i + 2] = 0.1 // Move slightly in front of reference marks

        // Color: selected white else red / yellow as in Java
        const selected = qi.isSelected ? qi.isSelected() : false
        if (selected) {
          colors[3 * i + 0] = 1.0
          colors[3 * i + 1] = 1.0
          colors[3 * i + 2] = 1.0
        } else {
          // In SKY_MODE Java used (251,255,0) else (255,0,0). We'll normalize 0..1
          if (state.mode === state.SKY_MODE) {
            colors[3 * i + 0] = 251 / 255
            colors[3 * i + 1] = 255 / 255
            colors[3 * i + 2] = 0 / 255
          } else {
            colors[3 * i + 0] = 1.0
            colors[3 * i + 1] = 0.0
            colors[3 * i + 2] = 0.0
          }
        }
      }

      state.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      state.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      state.geometry.attributes.position.needsUpdate = true
      state.geometry.attributes.color.needsUpdate = true
      state.geometry.computeBoundingSphere()
    }

    function drawReferenceMarks() {
      // Clear previous
      while (state.refGroup.children.length) state.refGroup.remove(state.refGroup.children[0])

      if (!state.showReferencesMarks) return

      if (state.mode === state.UNIVERSE_MODE) {
        // If kappa < 0 && view <=3 Java draws hyperbola shifted by -2.
        if (Environment.getKappa() < 0 && Environment.getView() <= 3) {
          // Draw hyperbola y = +/- sqrt(x^2 - 1) from x=1 to ascension_max
          const ascMax = Environment.getAscensionMax() || 6 // fallback
          const ptsTop = []
          const ptsBot = []
          for (let x = 1; x < ascMax; x += 0.02) {
            const y = Math.sqrt(Math.max(0, x * x - 1))
            ptsTop.push(new THREE.Vector3(x - 2.0, y, 0))
            ptsBot.push(new THREE.Vector3(x - 2.0, -y, 0))
          }
          const mat = new THREE.LineBasicMaterial({ color: 0x0000ff })
          const geomTop = new THREE.BufferGeometry().setFromPoints(ptsTop)
          const geomBot = new THREE.BufferGeometry().setFromPoints(ptsBot)
          state.refGroup.add(new THREE.Line(geomTop, mat))
          state.refGroup.add(new THREE.Line(geomBot, mat))
        } else {
          // Draw unit circle centered at 0,0 radius 1
          const circlePts = []
          const step = Math.PI / 100
          for (let ang = 0; ang <= Math.PI * 2 + step; ang += step) {
            const cx = Math.sin(ang) * 1
            const cy = Math.cos(ang) * 1
            circlePts.push(new THREE.Vector3(cx, cy, 0))
          }
          const mat = new THREE.LineBasicMaterial({ color: 0x0000ff })
          const geom = new THREE.BufferGeometry().setFromPoints(circlePts)
          state.refGroup.add(new THREE.Line(geom, mat))
        }
      } else {
        const pts = []
        // x axis: (0,0) to (2π, 0)
        pts.push(new THREE.Vector3(0, 0, 0))
        pts.push(new THREE.Vector3(2 * Math.PI, 0, 0))
        const geomX = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff })
        state.refGroup.add(new THREE.Line(geomX, mat))
        // y axis
        const ptsY = []
        ptsY.push(new THREE.Vector3(0, -Math.PI / 2, 0))
        ptsY.push(new THREE.Vector3(0, Math.PI / 2, 0))
        const geomY = new THREE.BufferGeometry().setFromPoints(ptsY)
        state.refGroup.add(new THREE.Line(geomY, mat))
      }
    }

    // Rendering loop
    function render() {
      if (!state.renderer) return
      updateCameraBounds()
      state.renderer.render(state.scene, state.camera)
    }

    // This method is called by Environment.update(...) -> environment.setOpenGLViewerCanvas(this)
    function updateCanvas() {
      // refresh points colors/positions from Environment.quasars
      populatePoints()
      drawReferenceMarks()
      render()

      // Update HUD count
      const q = Environment.getQuasars()
      quasarsCount.value = q ? q.length : 0
    }

    // Mouse / wheel / selection handlers mapping
    function onWheel(e) {
      if (!Environment.isSomethingToShow()) return
      e.preventDefault()
      // Wheel delta similar approach: adjust zoom proportional to current zoom
      const delta = e.deltaY || e.delta
      state.zoom += (-delta / 500.0) * state.zoom
      if (state.zoom < 1e-4) state.zoom = 1e-4
      state.mouseX = e.clientX
      state.mouseY = e.clientY
      state.zoomChanged = true
      // Adjust pos so zoom centers on mouse
      // Compute world coordinate under mouse before and after zoom to keep it stationary
      const before = pixelToWorld(e.clientX, e.clientY)
      updateCameraBounds() // apply zoom temporarily
      const after = pixelToWorld(e.clientX, e.clientY)
      // Modify posX/posY to keep point invariant
      state.posX += -(before.worldX - after.worldX)
      state.posY += -(before.worldY - after.worldY)

      updateCanvas()
    }

    function onContextMenu(e) {
      e.preventDefault()
    }

    function onMouseDown(e) {
      // Left button selection / drag
      if (!Environment.isSomethingToShow()) return
      if (e.button === 2) {
        // Right-click: reset view
        setMode(state.mode)
        updateCanvas()
        return
      }
      if (e.button === 0) {
        state.isDragging = true
        const { pixelX, pixelY } = pixelToWorld(e.clientX, e.clientY)
        state.mouseX = e.clientX
        state.mouseY = e.clientY
        state.selectX1 = pixelX
        state.selectY1 = pixelY
        state.selectX2 = pixelX
        state.selectY2 = pixelY
        if (state.selectionEnabled) {
          state.selecting = true
          state.isSelecting = true
        }
      }
    }

    function onMouseMove(e) {
      if (!Environment.isSomethingToShow()) return
      const rect = root.value.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      state.selectX2 = localX
      state.selectY2 = localY

      if (state.selecting && state.selectionEnabled) {
        // Update selection rectangle overlay only
        state.isSelecting = true
        render() // Allow selection box overlay to draw on top (HTML overlay)
      } else {
        // Moving mode (pan)
        if (state.isDragging && !state.selectionEnabled) {
          // compute world offsets similar to Java mouseDragged behaviour:
          const prev = pixelToWorld(state.mouseX, state.mouseY)
          const curr = pixelToWorld(e.clientX, e.clientY)

          // We want to shift the camera so that the point under mouse remains constant.
          const offsetX = prev.worldX - curr.worldX
          const offsetY = prev.worldY - curr.worldY

          state.posX += offsetX
          state.posY += offsetY

          state.mouseX = e.clientX
          state.mouseY = e.clientY
          updateCanvas()
        }
      }
    }

    function onMouseUp(e) {
      if (e.button === 0) {
        state.isDragging = false
      }
      if (e.button !== 0) return
      if (!Environment.isSomethingToShow()) return
      if (!state.selectionEnabled) return

      // Get selection rectangle in world coords
      const rect = root.value.getBoundingClientRect()
      // Pixel coords normalized to world: we need the world coords used when selecting.
      // We'll convert the pixel rectangle corners to world coords.
      const p1 = pixelToWorld(rect.left + state.selectX1, rect.top + state.selectY1)
      const p2 = pixelToWorld(rect.left + state.selectX2, rect.top + state.selectY2)

      // Compute selection rectangle in world coords (x1<x2, y1<y2)
      let selX1 = Math.min(p1.worldX, p2.worldX)
      let selX2 = Math.max(p1.worldX, p2.worldX)
      let selY1 = Math.min(p1.worldY, p2.worldY)
      let selY2 = Math.max(p1.worldY, p2.worldY)

      if (
        state.mode === state.UNIVERSE_MODE &&
        Environment.getKappa() < 0 &&
        Environment.getView() <= 3
      ) {
        selX1 += 2
        selX2 += 2
      }

      // Now iterate quasars and apply selection logic
      const q = Environment.getQuasars() || []
      let nbSelected = 0
      for (let i = 0; i < q.length; i++) {
        const qi = q[i]
        if (state.mode === state.UNIVERSE_MODE) {
          const x = qi.getx()
          const y = qi.gety()
          if (x > selX1 && x < selX2 && y > selY1 && y < selY2) {
            // SelectQuasar logic
            if (Quasar.getSelectedCount() !== 0 && !Quasar.isMultipleSelectionEnabled()) {
              if (qi.isSelected()) {
                qi.setSelected(true)
                nbSelected += 1
              } else {
                qi.setSelected(false)
              }
            } else {
              qi.setSelected(true)
              nbSelected += 1
            }
          } else {
            if (!Quasar.isMultipleSelectionEnabled()) qi.setSelected(false)
            else if (qi.isSelected()) nbSelected += 1
          }
        } else {
          // SKY_MODE: test against ascension/declination
          const asc = qi.getAscension()
          const dec = qi.getDeclination()
          if (asc > selX1 && asc < selX2 && dec > selY1 && dec < selY2) {
            if (Quasar.getSelectedCount() !== 0 && !Quasar.isMultipleSelectionEnabled()) {
              if (qi.isSelected()) {
                qi.setSelected(true)
                nbSelected += 1
              } else {
                qi.setSelected(false)
              }
            } else {
              qi.setSelected(true)
              nbSelected += 1
            }
          } else {
            if (!Quasar.isMultipleSelectionEnabled()) qi.setSelected(false)
            else if (qi.isSelected()) nbSelected += 1
          }
        }
      }

      Quasar.setSelectedCount(nbSelected)

      // Cleanup selection UI
      state.selecting = false
      state.isSelecting = false

      updateCanvas()
      // Call main window update if exists
      try {
        const mainWin = Environment.getMainWindow()
        if (mainWin && typeof mainWin.updateSelection === 'function') {
          mainWin.updateSelection()
        }
      } catch (err) {
        console.warn('ViewerCanvas: main window updateSelection unavailable', err)
      }
    }

    // Public API: expose updateCanvas via component instance ----
    onMounted(() => {
      // Init three only after DOM is ready
      initThree()

      // Wire events on root container
      const dom = root.value
      dom.addEventListener('wheel', onWheel, { passive: false })
      dom.addEventListener('contextmenu', onContextMenu)
      dom.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      // Register component instance into Environment so environment.update() can call updateCanvas()
      // Environment expects setOpenGLViewerCanvas(c)
      try {
        // Pass an object exposing updateCanvas and relevant setters (enableSelectionMode, setMode, setShowReferencesMarks)
        Environment.setOpenGLViewerCanvas({
          updateCanvas,
          enableSelectionMode: (s) => {
            state.selectionEnabled = !!s
          },
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
      } catch (err) {
        console.warn('Could not register viewer into Environment:', err)
      }
    })

    onBeforeUnmount(() => {
      // Cleanup events & three
      const dom = root.value
      if (dom) {
        dom.removeEventListener('wheel', onWheel)
        dom.removeEventListener('contextmenu', onContextMenu)
        dom.removeEventListener('mousedown', onMouseDown)
      }
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)

      if (state.renderer) {
        state.renderer.dispose()
        if (state.renderer.domElement && state.renderer.domElement.parentNode) {
          state.renderer.domElement.parentNode.removeChild(state.renderer.domElement)
        }
        state.renderer = null
      }
    })

    // Expose reactive properties & methods to template & parent instance
    return {
      root,
      overlay,
      selectionStyle,
      isSelecting: computed(() => state.isSelecting),
      modeName,
      quasarsCount,
      updateCanvas,
      enableSelectionMode: (s) => {
        state.selectionEnabled = !!s
      },
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
