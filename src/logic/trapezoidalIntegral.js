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

/**
 * Integral computation with trapezoidal rule
 */

/**
 * Numerical integration using fixed step trapezoidal rule.
 * @param {number} limitA - start of interval
 * @param {number} limitB - end of interval
 * @param {number} stepH - step size
 * @param {function} funcToIntegrate - the function to integrate
 * @returns {number} The estimated integral value.
 */
export function integrate(limitA, limitB, stepH, funcToIntegrate) {
  if (limitA === limitB) return 0
  let sum = 0

  // Calculate number of steps to cover the interval exactly
  const n = Math.ceil(Math.abs(limitB - limitA) / stepH)
  const realStep = (limitB - limitA) / n

  for (let i = 1; i < n; i++) {
    sum += funcToIntegrate(limitA + i * realStep)
  }

  sum *= realStep

  return (realStep / 2) * (funcToIntegrate(limitA) + funcToIntegrate(limitB)) + sum
}
