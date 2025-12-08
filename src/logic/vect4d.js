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

export default class Vect4d {
  constructor(x = 0, y = 0, z = 0, t = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.t = t;
  }

  // Accessors
  getX() { return this.x; }
  getY() { return this.y; }
  getZ() { return this.z; }
  getT() { return this.t; }

  setX(v) { this.x = v; }
  setY(v) { this.y = v; }
  setZ(v) { this.z = v; }
  setT(v) { this.t = v; }

  // Dot product
  dotProd4d(v) {
    return (
      this.x * v.x +
      this.y * v.y +
      this.z * v.z +
      this.t * v.t
    );
  }
}
