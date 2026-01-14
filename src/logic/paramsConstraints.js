/*
 * Copyright (C) 2025 Mathieu Abati <mathieu.abati@gmail.com>
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
 * Round a number to a specific number of decimal places.
 *
 * @param {number} n - The number to round.
 * @param {number} digits - The number of decimal places.
 * @returns {number} The rounded number.
 */
function roundTo(n, digits) {
  const factor = Math.pow(10, digits)
  return Math.round(n * factor) / factor
}

/**
 * Compute the sum of the cosmological parameters according to the Friedmann equation constraint.
 *
 * @param {number} lambda - Cosmological constant.
 * @param {number} omega - Matter density parameter.
 * @param {number} kappa - Curvature parameter.
 * @param {number} alpha - Radiation density parameter.
 * @returns {number} The sum lambda - kappa + omega + alpha.
 */
export function getSumConsts(lambda, omega, kappa, alpha) {
  return lambda - kappa + omega + alpha
}

const CONSTRAINT_BROKEN_PREFIX = 'Cosmological constraint broken:\n'

/**
 * Validate the cosmological parameters.
 * Throws an error if any constraint is broken.
 *
 * @param {number} lambda - Cosmological constant.
 * @param {number} omega - Matter density parameter.
 * @param {number} kappa - Curvature parameter.
 * @param {number} alpha - Radiation density parameter.
 * @param {boolean} [comovingSpaceFlag] - Whether comoving space is enabled.
 * @throws {Error} If a constraint is broken.
 */
export function validateCosmoParams(lambda, omega, kappa, alpha, comovingSpaceFlag) {
  if (roundTo(getSumConsts(lambda, omega, kappa, alpha), 5) !== 1.0) {
    throw new Error(CONSTRAINT_BROKEN_PREFIX + 'lambda - kappa + omega + alpha = 1.0 not verified!')
  }
  if (omega < 0) {
    throw new Error(CONSTRAINT_BROKEN_PREFIX + 'omega >= 0 not verified!')
  }
  if (lambda < 0) {
    throw new Error(CONSTRAINT_BROKEN_PREFIX + 'lambda >= 0 not verified!')
  }
  if (alpha < 0) {
    throw new Error(CONSTRAINT_BROKEN_PREFIX + 'alpha >= 0 not verified!')
  }
  if (!((27.0 / 4.0) * lambda * omega * omega > kappa * kappa * kappa)) {
    throw new Error(CONSTRAINT_BROKEN_PREFIX + '(27/4) * lambda * omega² > kappa^3 not verified!')
  }
  if (comovingSpaceFlag !== undefined && !comovingSpaceFlag && kappa === 0) {
    throw new Error('kappa can be equal to zero only if comoving space is enabled!')
  }
}

/**
 * Check if the cosmological parameters are valid.
 *
 * @param {number} lambda - Cosmological constant.
 * @param {number} omega - Matter density parameter.
 * @param {number} kappa - Curvature parameter.
 * @param {number} alpha - Radiation density parameter.
 * @param {boolean} [comovingSpaceFlag] - Whether comoving space is enabled.
 * @returns {boolean} True if the parameters are valid, false otherwise.
 */
export function isCosmoParamsValid(lambda, omega, kappa, alpha, comovingSpaceFlag) {
  try {
    validateCosmoParams(lambda, omega, kappa, alpha, comovingSpaceFlag)
    return true
  } catch {
    return false
  }
}
