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

import { polynomialP } from '@/logic/cosmologicalPolynomial.js'

/**
 * Pure function to calculate the evolution integrand
 * @param {number} x - Integration variable
 * @param {number} kappa - Curvature parameter
 * @param {number} lambda - Cosmological constant
 * @param {number} omega - Matter density parameter
 * @param {number} alpha - Radiation density parameter
 * @returns {number} The value of the integrand
 */
export function evolutionIntegrand(x, kappa, lambda, omega, alpha) {
  return 1.0 / Math.sqrt(polynomialP(x, kappa, lambda, omega, alpha))
}
