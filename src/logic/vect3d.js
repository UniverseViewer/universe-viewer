export default class Vect3d {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // Accessors
  getX() { return this.x; }
  getY() { return this.y; }
  getZ() { return this.z; }
  setX(v) { this.x = v; }
  setY(v) { this.y = v; }
  setZ(v) { this.z = v; }

  // Dot product
  dotProd3d(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  // Cross product
  vectProd3d(v) {
    return new Vect3d(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  // Euclidean norm
  norm() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
}

