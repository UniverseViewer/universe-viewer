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
