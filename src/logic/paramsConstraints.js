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

function roundTo(n, digits) {
  const factor = Math.pow(10, digits)
  return Math.round(n * factor) / factor
}

export function getSumConsts(lambda, omega, kappa, alpha) {
  return lambda - kappa + omega + alpha
}

const CONSTRAINT_BROKEN_PREFIX = "Cosmological constraint broken:\n"
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

export function isCosmoParamsValid(lambda, omega, kappa, alpha, comovingSpaceFlag) {
  try {
    validateCosmoParams(lambda, omega, kappa, alpha, comovingSpaceFlag)
    return true
  } catch (e) {
    return false
  }
}
