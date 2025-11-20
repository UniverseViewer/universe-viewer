let selectedCount = 0
let multipleSelection = true

export default class Quasar {
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

  static getSelectedCount() {
    return selectedCount
  }
  static setSelectedCount(n) {
    selectedCount = n
  }

  static isMultipleSelectionEnabled() {
    return multipleSelection
  }
  static setMultipleSelection(v) {
    multipleSelection = v
  }
}
