from astropy.io import fits
import pandas as pd
import numpy as np
from tqdm import tqdm

fits_file = "agnqso_desi.fits"
dat_file = "qso.dat"
max_qso = None

# Allowed SURVEY and PROGRAM values
valid_surveys = ["main", "sv3"]
valid_programs = ["dark", "bright"]

print(f"Loading {fits_file} ...", end="", flush=True)
with fits.open(fits_file) as hdul:
    data = hdul["AGNCAT"].data

    # Base QSO + ZWARN filter
    mask = (data["SPECTYPE"] == "QSO") & (data["ZWARN"] == 0)

    # SURVEY / PROGRAM filter
    mask &= np.isin(data["SURVEY"], valid_surveys)
    mask &= np.isin(data["PROGRAM"], valid_programs)

    qso_data = data[mask]

    if max_qso is not None:
        qso_data = qso_data[:max_qso]

    print(f" {len(qso_data):,} QSOs selected")

    ra_list = []
    dec_list = []
    z_list = []

    for row in tqdm(qso_data, desc="Processing QSOs"):
        ra_list.append(np.deg2rad(row["TARGET_RA"]))
        dec_list.append(np.deg2rad(row["TARGET_DEC"]))
        z_list.append(row["Z"])

    df = pd.DataFrame({
        "RA_rad": ra_list,
        "DEC_rad": dec_list,
        "z": z_list
    })

    print(f"Writing output file {dat_file} ...", end="", flush=True)
    df.to_csv(dat_file, sep=" ", header=False, index=False)
    print(" done.")

