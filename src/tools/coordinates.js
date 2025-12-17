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

// Helper function to format RA from radians to h:m:s
export function formatRa(radians) {
  const hours = (radians * 12) / Math.PI
  const h = Math.floor(hours)
  const minutes = (hours - h) * 60
  const m = Math.floor(minutes)
  const seconds = (minutes - m) * 60
  const s = seconds.toFixed(2)
  return `${h}h ${m}m ${s}s`
}

// Helper function to format Dec from radians to d:m:s
export function formatDec(radians) {
  const degrees = (radians * 180) / Math.PI
  const sign = degrees < 0 ? -1 : 1
  const absDeg = Math.abs(degrees)
  const d = Math.floor(absDeg)
  const minutes = (absDeg - d) * 60
  const m = Math.floor(minutes)
  const seconds = (minutes - m) * 60
  const s = seconds.toFixed(2)
  return `${sign < 0 ? '-' : ''}${d}° ${m}' ${s}''`
}
