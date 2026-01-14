/*
 * Copyright (C) 2008-2025 Mathieu Abati <mathieu.abati@gmail.com>
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

/**
 * Represents a 4D vector.
 */
export default class Vect4d {
  /**
   * Create a 4D vector.
   *
   * @param {number} [x=0] - X coordinate.
   * @param {number} [y=0] - Y coordinate.
   * @param {number} [z=0] - Z coordinate.
   * @param {number} [t=0] - T coordinate.
   */
  constructor(x = 0, y = 0, z = 0, t = 0) {
    this.x = x
    this.y = y
    this.z = z
    this.t = t
  }

  /** @returns {number} The X coordinate. */
  getX() {
    return this.x
  }
  /** @returns {number} The Y coordinate. */
  getY() {
    return this.y
  }
  /** @returns {number} The Z coordinate. */
  getZ() {
    return this.z
  }
  /** @returns {number} The T coordinate. */
  getT() {
    return this.t
  }

  /** @param {number} v - The new X coordinate. */
  setX(v) {
    this.x = v
  }
  /** @param {number} v - The new Y coordinate. */
  setY(v) {
    this.y = v
  }
  /** @param {number} v - The new Z coordinate. */
  setZ(v) {
    this.z = v
  }
  /** @param {number} v - The new T coordinate. */
  setT(v) {
    this.t = v
  }

  /**
   * Compute the dot product with another 4D vector.
   *
   * @param {Vect4d} v - The other vector.
   * @returns {number} The dot product.
   */
  dotProd4d(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.t * v.t
  }
}
