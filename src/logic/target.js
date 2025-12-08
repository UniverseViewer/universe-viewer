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

export default class Target {
  constructor({
    ascension = 0,
    declination = 0,
    redshift = 0,
    angularDistance = 0,
    magnitude = 0,
    pos = null,
    x = 0,
    y = 0,
    selected = false,
  } = {}) {
    this.ascension = ascension
    this.declination = declination
    this.redshift = redshift
    this.angularDistance = angularDistance
    this.magnitude = magnitude
    this.pos = pos // Vect4d
    this.x = x
    this.y = y
    this.selected = selected
  }

  getAscension() {
    return this.ascension
  }
  getDeclination() {
    return this.declination
  }
  getRedshift() {
    return this.redshift
  }
  getAngularDist() {
    return this.angularDistance
  }
  getMagnitude() {
    return this.magnitude
  }

  getPos() {
    return this.pos
  }
  getx() {
    return this.x
  }
  gety() {
    return this.y
  }

  isSelected() {
    return this.selected
  }

  setAscension(v) {
    this.ascension = v
  }
  setDeclination(v) {
    this.declination = v
  }
  setRedshift(v) {
    this.redshift = v
  }
  setAngularDist(v) {
    this.angularDistance = v
  }
  setMagnitude(v) {
    this.magnitude = v
  }

  setPos(v) {
    this.pos = v
  }
  setx(v) {
    this.x = v
  }
  sety(v) {
    this.y = v
  }

  setSelected(v) {
    this.selected = v
  }
}
