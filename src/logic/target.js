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
export const OFFSET_REDSHIFT = 0
export const OFFSET_RA = 1
export const OFFSET_DEC = 2
export const OFFSET_ANG_DIST = 3
export const OFFSET_POS_X = 4
export const OFFSET_POS_Y = 5
export const OFFSET_POS_Z = 6
export const OFFSET_POS_T = 7
export const OFFSET_PROJ_X = 8
export const OFFSET_PROJ_Y = 9
export const STRIDE = 10

export default class Target {
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

  getAscension() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_RA] : this.ascension
  }
  getDeclination() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_DEC] : this.declination
  }
  getRedshift() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_REDSHIFT] : this.redshift
  }
  getAngularDist() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_ANG_DIST] : this.angularDistance
  }

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
  getx() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_PROJ_X] : this.x
  }
  gety() {
    return this.isBufferBacked ? this.view[this.offset + OFFSET_PROJ_Y] : this.y
  }

  isSelected() {
    return this.selected
  }

  setAscension(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_RA] = v
    else this.ascension = v
  }
  setDeclination(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_DEC] = v
    else this.declination = v
  }
  setRedshift(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_REDSHIFT] = v
    else this.redshift = v
  }
  setAngularDist(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_ANG_DIST] = v
    else this.angularDistance = v
  }

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
  setx(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_PROJ_X] = v
    else this.x = v
  }
  sety(v) {
    if (this.isBufferBacked) this.view[this.offset + OFFSET_PROJ_Y] = v
    else this.y = v
  }

  setSelected(v) {
    this.selected = v
  }
}
