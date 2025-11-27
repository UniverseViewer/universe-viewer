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
      <div>Quasars: {{ quasars ? quasars.length : 0 }}</div>
    </div>
  </div>
</template>

<script>
import { onMounted, onBeforeUnmount, ref, reactive, computed, markRaw } from 'vue'
import { storeToRefs } from 'pinia'
import * as THREE from 'three'
import { useUniverseStore, UPDATE_VIEWER } from '@/stores/universe.js'
import { watch } from 'vue';

export default {
  name: 'ViewerCanvas',
  setup() {
    const root = ref(null)
    const overlay = ref(null)

    const store = useUniverseStore()
    const { quasars, kappa, view, ascension_max, somethingToShow, selectionModeType, pointSize } =
      storeToRefs(store)

    const state = reactive({
      zoom: 1.0,
      zoomChanged: false,
      posX: 0.0,
      posY: 0.0,
      xMin: -1,
      yMin: -1,
      xMax: 1,
      yMax: 1,
      selecting: false,
      selectionEnabled: false,
      selectX1: 0,
      selectY1: 0,
      selectX2: 0,
      selectY2: 0,
      isSelecting: false,
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

    const modeName = computed(() => (state.mode === state.UNIVERSE_MODE ? 'universe' : 'sky'))

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

    let resizeObserver = null;

    function onResize() {
      if (!root.value || !state.renderer || !state.camera) return;

      const width = root.value.clientWidth;
      const height = root.value.clientHeight;

      state.renderer.setSize(width, height);

      let contentWorldWidth;
      let contentWorldHeight;

      if (state.mode === state.UNIVERSE_MODE) {
        contentWorldWidth = state.xMax - state.xMin; // 2 units
        contentWorldHeight = state.yMax - state.yMin; // 2 units
      } else { // SKY_MODE
        contentWorldWidth = state.xMax - state.xMin; // 2 * Math.PI units
        contentWorldHeight = state.yMax - state.yMin; // Math.PI units
      }

      const viewAspectRatio = width / height;
      const contentAspectRatio = contentWorldWidth / contentWorldHeight;

      let halfVisibleWorldWidth;
      let halfVisibleWorldHeight;

      if (viewAspectRatio >= contentAspectRatio) {
        halfVisibleWorldHeight = contentWorldHeight / 2;
        halfVisibleWorldWidth = halfVisibleWorldHeight * viewAspectRatio;
      } else {
        halfVisibleWorldWidth = contentWorldWidth / 2;
        halfVisibleWorldHeight = halfVisibleWorldWidth / viewAspectRatio;
      }

      state.camera.left = -halfVisibleWorldWidth;
      state.camera.right = halfVisibleWorldWidth;
      state.camera.top = halfVisibleWorldHeight;
      state.camera.bottom = -halfVisibleWorldHeight;

      updateCameraBounds(); // This will apply state.posX, state.posY, state.zoom
      store.update(UPDATE_VIEWER);
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
      const u = (2.0 * localX - rect.width) / rect.width  // -1 to 1 in normalized device coords
      const v = -(2.0 * localY - rect.height) / rect.height // -1 to 1 in normalized device coords

      // Current center of camera view is camera.position
      const cx = state.camera.position.x;
      const cy = state.camera.position.y;

      // Calculate half-width/height of the currently visible world area
      const halfVisibleWorldWidth = (state.camera.right - state.camera.left) / 2 / state.camera.zoom;
      const halfVisibleWorldHeight = (state.camera.top - state.camera.bottom) / 2 / state.camera.zoom;

      const worldX = cx + u * halfVisibleWorldWidth;
      const worldY = cy + v * halfVisibleWorldHeight;

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
      if (!state.camera) return;

      state.camera.position.x = state.posX;
      state.camera.position.y = state.posY;
      state.camera.zoom = state.zoom;
      state.camera.updateProjectionMatrix();
    }

    function initThree() {
      const width = root.value.clientWidth
      const height = root.value.clientHeight

      state.renderer = markRaw(new THREE.WebGLRenderer({ antialias: true }))
      state.renderer.setSize(width, height)
      state.renderer.setPixelRatio(window.devicePixelRatio || 1)
      root.value.appendChild(state.renderer.domElement)

      state.scene = markRaw(new THREE.Scene())
      state.scene.background = new THREE.Color(0x000010);
      state.camera = markRaw(createOrthoCamera())
      onResize(); // Set initial camera projection based on current size

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

      if (state.mode === state.UNIVERSE_MODE) {
        if (kappa.value < 0 && view.value <= 3) {
          const ascMax = ascension_max.value || 6
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
          const circlePts = []
          const step = Math.PI / 100
          for (let ang = 0; ang <= Math.PI * 2 + step; ang += step) {
            const cx = Math.sin(ang) * 1
            const cy = Math.cos(ang) * 1
            circlePts.push(new THREE.Vector3(cx, cy, 0))
          }
          const mat = new THREE.LineBasicMaterial({ color: 0x888888 })
          const geom = new THREE.BufferGeometry().setFromPoints(circlePts)
          state.refGroup.add(new THREE.Line(geom, mat))
        }
      } else {
        const pts = []
        pts.push(new THREE.Vector3(0, 0, 0))
        pts.push(new THREE.Vector3(2 * Math.PI, 0, 0))
        const geomX = new THREE.BufferGeometry().setFromPoints(pts)
        const mat = new THREE.LineBasicMaterial({ color: 0xffffff })
        state.refGroup.add(new THREE.Line(geomX, mat))
        const ptsY = []
        ptsY.push(new THREE.Vector3(0, -Math.PI / 2, 0))
        ptsY.push(new THREE.Vector3(0, Math.PI / 2, 0))
        const geomY = new THREE.BufferGeometry().setFromPoints(ptsY)
        state.refGroup.add(new THREE.Line(geomY, mat))
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
      if (!somethingToShow.value) return
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
      state.posX += (before.worldX - after.worldX)
      state.posY += (before.worldY - after.worldY)
      updateCanvas()
    }

    function onContextMenu(e) {
      e.preventDefault()
    }

    function onMouseDown(e) {
      if (!somethingToShow.value) return
      if (e.button === 2) {
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
      if (!somethingToShow.value) return
      const rect = root.value.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      state.selectX2 = localX
      state.selectY2 = localY

      if (state.selecting && state.selectionEnabled) {
        state.isSelecting = true
        render()
      } else {
        if (state.isDragging && !state.selectionEnabled) {
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
    }

    function onMouseUp(e) {
      if (e.button === 0) {
        state.isDragging = false
      }
      if (e.button !== 0) return
      if (!somethingToShow.value) return
      if (!state.selectionEnabled) return
      if (!state.selecting) return

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
      const previouslySelected = new Set();
      if (selectionModeType.value === 'intersection') {
        q.forEach(qi => {
          if (qi.isSelected()) {
            previouslySelected.add(qi);
          }
        });
      }

      // Initial deselection for 'replace' and 'intersection' modes
      // For 'additive', existing selections outside the new rectangle remain selected.
      if (selectionModeType.value === 'replace' || selectionModeType.value === 'intersection') {
        q.forEach(qi => qi.setSelected(false));
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

        const isInsideRectangle = (x > selX1 && x < selX2 && y > selY1 && y < selY2);

        switch (selectionModeType.value) {
          case 'additive':
            if (isInsideRectangle) {
              qi.setSelected(true);
            }
            // If not inside, its state remains unchanged (additive)
            break;
          case 'replace':
            if (isInsideRectangle) {
              qi.setSelected(true);
            }
            // If not inside, it was already deselected above
            break;
          case 'intersection':
            if (isInsideRectangle && previouslySelected.has(qi)) {
              qi.setSelected(true);
            }
            // If not inside or not previously selected, it was already deselected above
            break;
        }

        if (qi.isSelected()) {
          nbSelected += 1;
        }
      }

      store.setSelectedCount(nbSelected)

      state.selecting = false
      state.isSelecting = false

      updateCanvas()
      if (store.mainWin && typeof store.mainWin.updateSelection === 'function') {
        store.mainWin.updateSelection()
      }
    }

    onMounted(() => {
      initThree()
      const dom = root.value
      dom.addEventListener('wheel', onWheel, { passive: false })
      dom.addEventListener('contextmenu', onContextMenu)
      dom.addEventListener('mousedown', onMouseDown)
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)

      resizeObserver = new ResizeObserver(() => onResize());
      if (root.value) {
        resizeObserver.observe(root.value);
      }

      store.setViewerCanvas({
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

      if (resizeObserver) {
        resizeObserver.disconnect();
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
  position: absolute;
  border: 2px solid rgba(0, 255, 0, 0.9);
  background: rgba(0, 255, 0, 0.08);
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
