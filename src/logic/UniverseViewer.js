// src/logic/UniverseViewer.js
// Three.js based UniverseViewer engine adapted from original ViewerCanvas.java logic.
// Usage:
//   const viewer = new UniverseViewer(containerElement);
//   viewer.init();
//   viewer.update(); // redraw from Environment.getQuasars()
//   viewer.setMode('UNIVERSE'|'SKY');
//   viewer.enableSelectionMode(true/false);
//   viewer.selectRectangle(x1,y1,x2,y2); // pixel coordinates relative to renderer.domElement
//
// Requires:
//   npm install three
//   Environment module at '@/logic/environment.js' implementing getQuasars(), getKappa(), getView(), getAscensionMax(), etc.
//   Quasar objects with getx(), gety(), getAscension(), getDeclination(), isSelected(), setSelected(), Quasar static methods
//
// This file is written in plain JavaScript (ES module).
import * as THREE from 'three';
import * as Environment from '@/logic/environment.js';
import Quasar from '@/logic/quasar.js';

export default class UniverseViewer {
  constructor(container, options = {}) {
    this.container = container;
    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 600;

    // three essentials
    this.renderer = null;
    this.scene = null;
    this.camera = null;

    // points
    this.points = null;
    this.geometry = null;
    this.material = null;

    // reference marks group
    this.refGroup = null;

    // options
    this.showReferenceMarks = true;
    this.mode = 'UNIVERSE'; // or 'SKY'
    this.selectionEnabled = false;

    // interaction state
    this.zoom = 1.0;
    this.posX = 0;
    this.posY = 0;

    // keep a local quasar array reference for faster ops
    this.quasars = [];

    // pixelRatio
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    // event handlers binding
    this._onWindowResize = this._onWindowResize.bind(this);

    // options overrides
    if (options.mode) this.mode = options.mode;
    if (options.showReferenceMarks !== undefined) this.showReferenceMarks = !!options.showReferenceMarks;
  }

  init() {
    // init three renderer, scene, camera
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();

    // orthographic camera to match map-like projections
    const aspect = this.width / this.height;
    // initial world coords similar to ViewerCanvas: UNIVERSE = [-1,1] x [-1,1], SKY = [0,2] x [-1,1]
    let left = -1, right = 1, top = 1, bottom = -1;
    if (this.mode === 'SKY') {
      left = 0; right = 2; top = 1; bottom = -1;
    }
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, -1000, 1000);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    // geometry & material
    this.geometry = new THREE.BufferGeometry();
    // placeholders
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 3));

    this.material = new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      sizeAttenuation: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);

    // reference marks
    this.refGroup = new THREE.Group();
    this.scene.add(this.refGroup);

    // initial populate
    this._refreshQuasarReference();
    this._drawReferenceMarks();

    // start render
    this._render();

    // events
    window.addEventListener('resize', this._onWindowResize);
  }

  dispose() {
    window.removeEventListener('resize', this._onWindowResize);
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }
    // clean scene
    if (this.scene) {
      this.scene.clear();
      this.scene = null;
    }
  }

  _onWindowResize() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    if (!this.renderer) return;
    this.renderer.setSize(this.width, this.height);
    // keep camera bounds consistent: recompute extents based on mode
    if (this.mode === 'UNIVERSE') {
      this.camera.left = -1 + this.posX;
      this.camera.right = 1 + this.posX;
      this.camera.top = 1 + this.posY;
      this.camera.bottom = -1 + this.posY;
    } else {
      this.camera.left = 0 + this.posX;
      this.camera.right = 2 + this.posX;
      this.camera.top = 1 + this.posY;
      this.camera.bottom = -1 + this.posY;
    }
    this.camera.updateProjectionMatrix();
  }

  _render() {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }

  // public API
  setMode(mode) {
    if (mode !== 'UNIVERSE' && mode !== 'SKY') throw new Error('Mode must be "UNIVERSE" or "SKY"');
    this.mode = mode;
    // reset camera extents similar to Java setMode
    if (this.mode === 'UNIVERSE') {
      this.camera.left = -1 + this.posX; this.camera.right = 1 + this.posX;
      this.camera.bottom = -1 + this.posY; this.camera.top = 1 + this.posY;
    } else {
      this.camera.left = 0 + this.posX; this.camera.right = 2 + this.posX;
      this.camera.bottom = -1 + this.posY; this.camera.top = 1 + this.posY;
    }
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
    this._drawReferenceMarks();
    this._refreshQuasarReference();
    this._render();
  }

  setShowReferenceMarks(flag) {
    this.showReferenceMarks = !!flag;
    this._drawReferenceMarks();
    this._render();
  }

  enableSelectionMode(flag) {
    this.selectionEnabled = !!flag;
  }

  // update scene from Environment quasars (positions/colors)
  update() {
    // get quasars
    const q = Environment.getQuasars() || [];
    this.quasars = q;
    this._populatePoints();
    this._drawReferenceMarks();
    this._render();
  }

  // internal: recompute local references
  _refreshQuasarReference() {
    this.quasars = Environment.getQuasars() || [];
    // nothing else for now
  }

  _populatePoints() {
    const q = this.quasars || [];
    const N = q.length;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      const qi = q[i];
      // safe getters
      const x = (typeof qi.getx === 'function') ? qi.getx() : 0;
      const y = (typeof qi.gety === 'function') ? qi.gety() : 0;
      positions[3 * i + 0] = x;
      positions[3 * i + 1] = y;
      positions[3 * i + 2] = 0;

      const selected = (typeof qi.isSelected === 'function') ? qi.isSelected() : false;
      if (selected) {
        colors[3 * i + 0] = 1; colors[3 * i + 1] = 1; colors[3 * i + 2] = 1;
      } else {
        if (this.mode === 'SKY') {
          colors[3 * i + 0] = 251 / 255; colors[3 * i + 1] = 255 / 255; colors[3 * i + 2] = 0;
        } else {
          colors[3 * i + 0] = 1; colors[3 * i + 1] = 0; colors[3 * i + 2] = 0;
        }
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  _clearRefGroup() {
    while (this.refGroup.children.length) {
      const obj = this.refGroup.children[0];
      this.refGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
  }

  _drawReferenceMarks() {
    this._clearRefGroup();
    if (!this.showReferenceMarks) return;

    if (this.mode === 'UNIVERSE') {
      // follow ViewerCanvas logic: if kappa<0 and view<=3 draw hyperbola shifted by -2, else unit circle
      if (Environment.getKappa() < 0 && Environment.getView() <= 3) {
        const ascMax = Environment.getAscensionMax() || 6;
        const pointsTop = [];
        const pointsBot = [];
        for (let x = 1; x < ascMax; x += 0.02) {
          const y = Math.sqrt(Math.max(0, x * x - 1));
          pointsTop.push(new THREE.Vector3(x - 2.0, y, 0));
          pointsBot.push(new THREE.Vector3(x - 2.0, -y, 0));
        }
        const mat = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const geomTop = new THREE.BufferGeometry().setFromPoints(pointsTop);
        const geomBot = new THREE.BufferGeometry().setFromPoints(pointsBot);
        this.refGroup.add(new THREE.Line(geomTop, mat));
        this.refGroup.add(new THREE.Line(geomBot, mat));
      } else {
        // unit circle
        const circlePts = [];
        const step = Math.PI / 180;
        for (let ang = 0; ang <= Math.PI * 2 + step; ang += step) {
          const cx = Math.sin(ang) * 1;
          const cy = Math.cos(ang) * 1;
          circlePts.push(new THREE.Vector3(cx, cy, 0));
        }
        const mat = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const geom = new THREE.BufferGeometry().setFromPoints(circlePts);
        this.refGroup.add(new THREE.Line(geom, mat));
      }
    } else {
      // SKY mode: draw x axis from 0..2π and y axis -π/2..π/2
      const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
      const axisX = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(2 * Math.PI, 0, 0)];
      const axisY = [new THREE.Vector3(0, -Math.PI / 2, 0), new THREE.Vector3(0, Math.PI / 2, 0)];
      this.refGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(axisX), mat));
      this.refGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(axisY), mat));
    }
  }

  // selection by pixel rectangle (relative to renderer.domElement)
  // x1,y1,x2,y2 in pixels
  selectRectangle(x1, y1, x2, y2) {
    if (!this.quasars || !this.quasars.length) return;
    // normalize rect
    const left = Math.min(x1, x2), right = Math.max(x1, x2);
    const top = Math.min(y1, y2), bottom = Math.max(y1, y2);
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    let nbSelected = 0;
    for (let i = 0; i < this.quasars.length; i++) {
      const qi = this.quasars[i];
      if (this.mode === 'UNIVERSE') {
        // project world pos (getx/gety) to NDC and then to pixels
        const wx = qi.getx();
        const wy = qi.gety();
        const v = new THREE.Vector3(wx, wy, 0);
        v.project(this.camera);
        const sx = (v.x * 0.5 + 0.5) * rect.width;
        const sy = (-v.y * 0.5 + 0.5) * rect.height;
        if (sx > left && sx < right && sy > top && sy < bottom) {
          // selection logic same as Java
          if ((Quasar.getSelectedCount() !== 0) && !Quasar.isMultipleSelectionEnabled()) {
            if (qi.isSelected()) {
              qi.setSelected(true);
              nbSelected++;
            } else {
              qi.setSelected(false);
            }
          } else {
            qi.setSelected(true);
            nbSelected++;
          }
        } else {
          if (!Quasar.isMultipleSelectionEnabled()) qi.setSelected(false);
          else if (qi.isSelected()) nbSelected++;
        }
      } else {
        // SKY mode: compare asc/dec with rect converted to asc/dec ranges
        // need to convert rect pixels to asc/dec ranges
        // compute world coords at left/top and right/bottom
        const topLeftNDC = new THREE.Vector3((left / rect.width) * 2 - 1, - (top / rect.height) * 2 + 1, 0);
        const bottomRightNDC = new THREE.Vector3((right / rect.width) * 2 - 1, - (bottom / rect.height) * 2 + 1, 0);
        // unproject to world
        const topLeft = topLeftNDC.clone().unproject(this.camera);
        const bottomRight = bottomRightNDC.clone().unproject(this.camera);
        // In SKY mode Java multiplies x by PI and y by PI/2 before comparing with asc/dec
        const selX1 = Math.min(topLeft.x, bottomRight.x) * Math.PI;
        const selX2 = Math.max(topLeft.x, bottomRight.x) * Math.PI;
        const selY1 = Math.min(bottomRight.y, topLeft.y) * (Math.PI / 2.0);
        const selY2 = Math.max(bottomRight.y, topLeft.y) * (Math.PI / 2.0);

        const asc = qi.getAscension();
        const dec = qi.getDeclination();
        if (asc > selX1 && asc < selX2 && dec > selY1 && dec < selY2) {
          if ((Quasar.getSelectedCount() !== 0) && !Quasar.isMultipleSelectionEnabled()) {
            if (qi.isSelected()) {
              qi.setSelected(true);
              nbSelected++;
            } else {
              qi.setSelected(false);
            }
          } else {
            qi.setSelected(true);
            nbSelected++;
          }
        } else {
          if (!Quasar.isMultipleSelectionEnabled()) qi.setSelected(false);
          else if (qi.isSelected()) nbSelected++;
        }
      }
    }

    Quasar.setSelectedCount(nbSelected);
    // after selection, refresh colors on GPU
    this._populatePoints();
    this._render();
  }
}
