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
 * Represents a 3D vector.
 */
export default class Vect3d {
  /**
   * Create a 3D vector.
   *
   * @param {number} [x=0] - X coordinate.
   * @param {number} [y=0] - Y coordinate.
   * @param {number} [z=0] - Z coordinate.
   */
  constructor(x = 0, y = 0, z = 0) {
    this.x = x
    this.y = y
    this.z = z
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

  /**
   * Compute the dot product with another 3D vector.
   *
   * @param {Vect3d} v - The other vector.
   * @returns {number} The dot product.
   */
  dotProd3d(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z
  }

  /**
   * Compute the cross product with another 3D vector.
   *
   * @param {Vect3d} v - The other vector.
   * @returns {Vect3d} The resulting cross product vector.
   */
  vectProd3d(v) {
    return new Vect3d(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x,
    )
  }

  /**
   * Compute the Euclidean norm of the vector.
   *
   * @returns {number} The vector norm.
   */
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
  }
}
