/*
 * Copyright (C) 2008-2028 Mathieu Abati <mathieu.abati@gmail.com>
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
 * Calculate the polynomial P(a).
 * @param {number} a - Expansion parameter.
 * @param {number} kappa - Curvature parameter.
 * @param {number} lambda - Cosmological constant.
 * @param {number} omega - Density parameter.
 * @param {number} alpha - Accounts for the presence of CMB photons as sources of gravity.
 * @returns {number} The value of P(a)
 */
export function polynomialP(a, kappa, lambda, omega, alpha) {
  return lambda * Math.pow(a, 4) - kappa * a * a + omega * a + alpha
}
