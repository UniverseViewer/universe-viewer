"""
 * Copyright (C) 2025 Mathieu Abati <mathieu.abati@gmail.com>
 * Copyright (C) 2025 Roland Triay <triay@cpt.univ-mrs.fr>
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
"""

from astropy.io import fits
import pandas as pd
import numpy as np
from tqdm import tqdm
from sys import argv, exit, stderr

def usage():
    print(f"Usage: {argv[0]} <catalog>", file=stderr)
    print("\tWith catalog in: agn, qso", file=stderr)
    exit(1)

if len(argv) != 2:
    usage()

if argv[1] == "agn":
    fits_file = "VII_258_agn.dat.fits"
    dat_file = "agn.dat"
elif argv[1] == "qso":
    fits_file = "VII_258_qso.dat.fits"
    dat_file = "qso.dat"
else:
    usage()

max_qso = None

print(f"Loading {fits_file} ...", end="", flush=True)
with fits.open(fits_file) as hdul:
    data = hdul[dat_file].data   # VizieR tables are usually HDU 1

    if max_qso is not None:
        data = data[:max_qso]

    print(f" {len(data):,} objects selected")

    ra_list = []
    dec_list = []
    z_list = []

    for row in tqdm(data, desc="Processing objects"):
        # RA in hours, degrees, radians
        ra_hours = row["RAh"] + row["RAm"] / 60.0 + row["RAs"] / 3600.0
        ra_rad = np.deg2rad(15.0 * ra_hours)

        # Dec with sign
        sign = -1.0 if row["DE-"] == b"-" else 1.0
        dec_deg = sign * (row["DEd"] + row["DEm"] / 60.0 + row["DEs"] / 3600.0)
        dec_rad = np.deg2rad(dec_deg)

        ra_list.append(ra_rad)
        dec_list.append(dec_rad)
        z_list.append(row["z"])

    df = pd.DataFrame({
        "RA_rad": ra_list,
        "DEC_rad": dec_list,
        "z": z_list
    })

    print(f"Writing output file {dat_file} ...", end="", flush=True)
    df.to_csv(dat_file, sep=" ", header=False, index=False)
    print(" done.")

