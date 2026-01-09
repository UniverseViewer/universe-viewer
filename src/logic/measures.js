/*
 * Copyright (C) 2008-2026 Mathieu Abati <mathieu.abati@gmail.com>
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
 * Compute euclidian scalar product between two targets celestial directions vectors.
 *
 * @param {Target} target1 - First target
 * @param {Target} target2 - Second target
 * @return {number} The scalar product between the two targets celestial directions vectors.
 */
export function computeEuclidianScalarProduct(target1, target2) {
  const ra1 = target1.getAscension()
  const dec1 = target1.getDeclination()
  const ra2 = target2.getAscension()
  const dec2 = target2.getDeclination()
  return Math.cos(ra1 - ra2) * Math.cos(dec1) * Math.cos(dec2) + Math.sin(dec1) * Math.sin(dec2)
}

/**
 * Compute the apparent angular separation between two targets on a chosen reference sky.
 *
 * @param {Target} target1 - First target
 * @param {Target} target2 - Second target
 * @param {number} sky - The sky to use: Earth sky (0), first target sky (1), second target sky (2)
 * @return {number} The angular separation between the two targets (radians)
 */

export function computeAngularSeparation(target1, target2, sky = 0) {
  let cosTheta

  if (sky === 0) {
    // Earth sky
    cosTheta = computeEuclidianScalarProduct(target1, target2)
  } else {
    // Choose reference object
    const ref = (sky === 1) ? target1 : target2
    const other = (sky === 1) ? target2 : target1
    const rRef = ref.getPos()
    const rOther = other.getPos()

    // Direction from ref to other
    const dx = rOther.x - rRef.x
    const dy = rOther.y - rRef.y
    const dz = rOther.z - rRef.z
    const dLen = Math.sqrt(dx*dx + dy*dy + dz*dz)
    if (dLen === 0) return 0
    const ux = dx / dLen
    const uy = dy / dLen
    const uz = dz / dLen

    // Direction from ref to Earth
    const rLen = Math.sqrt(rRef.x*rRef.x + rRef.y*rRef.y + rRef.z*rRef.z)
    if (rLen === 0) return 0
    const uTx = -rRef.x / rLen
    const uTy = -rRef.y / rLen
    const uTz = -rRef.z / rLen
    cosTheta = ux*uTx + uy*uTy + uz*uTz
  }

  cosTheta = Math.max(-1, Math.min(1, cosTheta))
  return Math.acos(cosTheta)
}

/**
 * Compute the geodesic angular distance between two targets.
 *
 * @param {Target} target1 - First target
 * @param {Target} target2 - Second target
 * @param {number} kappa - Curvature parameter
 * @returns {number} The angular distance between the two targets
 */
export function computeAngularDistance(target1, target2, kappa) {
  const tau1 = target1.getAngularDist()
  const tau2 = target2.getAngularDist()
  const cosTheta12 = computeEuclidianScalarProduct(target1, target2)

  if (kappa > 0) {
    const cosTau12 = cosTheta12 * Math.sin(tau1) * Math.sin(tau2) + Math.cos(tau1) * Math.cos(tau2)
    // Below, we are clamping between -1 and 1, as even if perfect result is between -1 and 1, computation may lead to imprecisions, and acos only accepts values between -1 and 1
    return Math.acos(Math.max(-1, Math.min(1, cosTau12)))
  } else if (kappa < 0) {
    const coshTau12 = Math.cosh(tau1) * Math.cosh(tau2) - cosTheta12 * Math.sinh(tau1) * Math.sinh(tau2)
    // Below, we are limiting to minimum 1, as even if perfect result is >= 1, computation may lead to imprecisions, and acosh only accepts values >= 1
    return Math.acosh(Math.max(1, coshTau12))
  } else { // kappa = 0
    return Math.sqrt(Math.max(0, tau1 * tau1 + tau2 * tau2 - 2 * tau1 * tau2 * cosTheta12))
  }
}

/**
 * Compute the comoving distance between two targets.
 *
 * @param {Target} target1 - First target
 * @param {Target} target2 - Second target
 * @param {number} kappa - Curvature parameter
 * @returns {number} The comoving distance between the two targets
 */
export function computeComovingDistance(target1, target2, kappa) {
  const tau12 = computeAngularDistance(target1, target2, kappa)

  if (kappa === 0) {
    return tau12
  } else {
    return tau12 / Math.sqrt(Math.abs(kappa))
  }
}

/**
 * Converts the dimensionless scale-free comoving distance to a physical distance in Megaparsecs (Mpc).
 * We have r = tau / H0, to get Mpc, we use (tau * c) / H0
 *
 * @param {number} tau - The dimensionless comoving distance.
 * @param {number} h0 - The Hubble constant.
 * @returns {number} The physical distance in Mpc.
 */
export function comovingDistanceToMpc(tau, h0) {
  const C_KM_S = 299792.458; // Speed of light in km/s
  if (!h0) {
    return 0
  }
  return (tau * C_KM_S) / h0;
}
