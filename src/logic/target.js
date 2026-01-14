/*
 * Copyright (C) 2008-2023 Mathieu Abati <mathieu.abati@gmail.com>
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

// Data layout constants for SharedArrayBuffer
/** @type {number} Offset of redshift in SharedArrayBuffer. */
export const OFFSET_REDSHIFT = 0
/** @type {number} Offset of Right Ascension in SharedArrayBuffer. */
export const OFFSET_RA = 1
/** @type {number} Offset of Declination in SharedArrayBuffer. */
export const OFFSET_DEC = 2
/** @type {number} Offset of dimensionless angular distance in SharedArrayBuffer. */
export const OFFSET_ANG_DIST = 3
/** @type {number} Offset of position X in SharedArrayBuffer. */
export const OFFSET_POS_X = 4
/** @type {number} Offset of position Y in SharedArrayBuffer. */
export const OFFSET_POS_Y = 5
/** @type {number} Offset of position Z in SharedArrayBuffer. */
export const OFFSET_POS_Z = 6
/** @type {number} Offset of position T in SharedArrayBuffer. */
export const OFFSET_POS_T = 7
/** @type {number} Offset of projection X in SharedArrayBuffer. */
export const OFFSET_PROJ_X = 8
/** @type {number} Offset of projection Y in SharedArrayBuffer. */
export const OFFSET_PROJ_Y = 9
/** @type {number} Total elements per target in SharedArrayBuffer. */
export const STRIDE = 10

/**
 * Represents an astronomical target (quasar, AGN, galaxy, etc.).
 * Can be backed by a regular object or a SharedArrayBuffer for performance.
 */
export default class Target {
  /**
   * Create a Target.
   *
   * @param {Object} [options={}] - Creation options.
   * @param {Float64Array} [options.bufferView=null] - View on a SharedArrayBuffer for high performance.
   * @param {number} [options.index=0] - Index of the target within the buffer.
   * @param {number} [options.ascension=0] - Right Ascension (radians).
   * @param {number} [options.declination=0] - Declination (radians).
   * @param {number} [options.redshift=0] - Redshift.
   */
  constructor({
    // Buffer mode arguments
    bufferView = null,
    index = 0,
    // Object mode arguments
    ascension = 0,
    declination = 0,
    redshift = 0,
  } = {}) {
    if (bufferView) {
      this.isBufferBacked = true
      this.view = bufferView
      this.offset = index * STRIDE
    } else {
      this.isBufferBacked = false
      this.ascension = ascension
      this.declination = declination
      this.redshift = redshift
    }
  }

  /** @returns {number} The Right Ascension (radians). */
  getAscension() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_RA] : this.ascension
  }
  /** @returns {number} The Declination (radians). */
  getDeclination() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_DEC] : this.declination
  }
  /** @returns {number} The Redshift. */
  getRedshift() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_REDSHIFT] : this.redshift
  }
  /** @returns {number} The dimensionless angular distance. */
  getAngularDist() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_ANG_DIST] : this.angularDistance
  }

  /** @returns {Object|Vect4d} The 4D position. */
  getPos() {
    if (this.isBufferBacked) {
      const x = this.view[this.offset + OFFSET_POS_X]
      const y = this.view[this.offset + OFFSET_POS_Y]
      const z = this.view[this.offset + OFFSET_POS_Z]
      const t = this.view[this.offset + OFFSET_POS_T]
      return {
        x,
        y,
        z,
        t,
        getX: () => x,
        getY: () => y,
        getZ: () => z,
        getT: () => t,
      }
    } else {
      return this.pos
    }
  }
  /** @returns {number} The projected X coordinate. */
  getx() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_PROJ_X] : this.x
  }
  /** @returns {number} The projected Y coordinate. */
  gety() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_PROJ_Y] : this.y
  }

  /** @returns {boolean} True if the target is selected. */
  isSelected() {
    return this.selected
  }

  /** @param {number} v - The new Right Ascension (radians). */
  setAscension(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_RA] = v
    else this.ascension = v
  }
  /** @param {number} v - The new Declination (radians). */
  setDeclination(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_DEC] = v
    else this.declination = v
  }
  /** @param {number} v - The new Redshift. */
  setRedshift(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_REDSHIFT] = v
    else this.redshift = v
  }
  /** @param {number} v - The new dimensionless angular distance. */
  setAngularDist(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_ANG_DIST] = v
    else this.angularDistance = v
  }

  /** @param {Vect4d|Object} v - The new 4D position. */
  setPos(v) {
    if (this.isBufferBacked) {
      this.view[this.offset + OFFSET_POS_X] = v.x || v.getX()
      this.view[this.offset + OFFSET_POS_Y] = v.y || v.getY()
      this.view[this.offset + OFFSET_POS_Z] = v.z || v.getZ()
      this.view[this.offset + OFFSET_POS_T] = v.t || v.getT()
    } else {
      this.pos = v
    }
  }
  /** @param {number} v - The new projected X coordinate. */
  setx(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_PROJ_X] = v
    else this.x = v
  }
  /** @param {number} v - The new projected Y coordinate. */
  sety(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_PROJ_Y] = v
    else this.y = v
  }

  /** @param {boolean} v - Selection state. */
  setSelected(v) {
    this.selected = v
  }
}
