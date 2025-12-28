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

fits_file = "J_ApJS_199_26_table3.dat.gz.fits"
dat_file = "2mrs.dat"

max_qso = None

print(f"Loading {fits_file} ...", end="", flush=True)
with fits.open(fits_file) as hdul:
    data = hdul[1].data

    if max_qso is not None:
        data = data[:max_qso]

    print(f" {len(data):,} objects selected")

    ra_list = []
    dec_list = []
    z_list = []

    for row in tqdm(data, desc="Processing objects"):
        cz = row["cz"]
        if cz < 0:
          continue
        ra_list.append(np.deg2rad(row["RAdeg"]))
        dec_list.append(np.deg2rad(row["DEdeg"]))
        z_list.append(cz / 299792.458)

    df = pd.DataFrame({
        "RA_rad": ra_list,
        "DEC_rad": dec_list,
        "z": z_list
    })

    print(f"Writing output file {dat_file} ...", end="", flush=True)
    df.to_csv(dat_file, sep=" ", header=False, index=False)
    print(" done.")

