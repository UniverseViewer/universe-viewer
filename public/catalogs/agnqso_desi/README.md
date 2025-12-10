# AGN/QSO Value-Added Catalog for DESI DR1

It has been converted to UniverseViewer data format using the `extract.py` script.
The following filtering has been made on original catalog:
- `QSO` spectral type,
- `main` and `sv3` surveys,
- `dark` and `bright` programs,
- no redshift warning flags.

The result has been compressed with:
```
gzip -c agnqso_desi_QSO.dat > qso.gz
```

To run the conversion script, you have to download the `agnqso_desi.fits` file from https://data.desi.lbl.gov/public/dr1/vac/dr1/agnqso/v1.0/ URL.

## Acknowledgments

This research used data obtained with the Dark Energy Spectroscopic Instrument (DESI). DESI construction and operations is managed by the Lawrence Berkeley National Laboratory. This material is based upon work supported by the U.S. Department of Energy, Office of Science, Office of High-Energy Physics, under Contract No. DE–AC02–05CH11231, and by the National Energy Research Scientific Computing Center, a DOE Office of Science User Facility under the same contract. Additional support for DESI was provided by the U.S. National Science Foundation (NSF), Division of Astronomical Sciences under Contract No. AST-0950945 to the NSF’s National Optical-Infrared Astronomy Research Laboratory; the Science and Technology Facilities Council of the United Kingdom; the Gordon and Betty Moore Foundation; the Heising-Simons Foundation; the French Alternative Energies and Atomic Energy Commission (CEA); the National Council of Humanities, Science and Technology of Mexico (CONAHCYT); the Ministry of Science and Innovation of Spain (MICINN), and by the DESI Member Institutions: www.desi.lbl.gov/collaborating-institutions. The DESI collaboration is honored to be permitted to conduct scientific research on I’oligam Du’ag (Kitt Peak), a mountain with particular significance to the Tohono O’odham Nation. Any opinions, findings, and conclusions or recommendations expressed in this material are those of the author(s) and do not necessarily reflect the views of the U.S. National Science Foundation, the U.S. Department of Energy, or any of the listed funding agencies.

## License

This catalog is licensed under the [Creative Commons Attribution 4.0 International License ](https://creativecommons.org/licenses/by/4.0/).

## References

- EDR: [DESI Collaboration et al. (2024)](https://ui.adsabs.harvard.edu/abs/2024AJ....168...58D/abstract), “The Early Data Release of the Dark Energy Spectroscopic Instrument”; or
- DR1: [DESI Collaboration et al. (2025)](https://arxiv.org/abs/2503.14745) “Data Release 1 of the Dark Energy Spectroscopic Instrument”

See https://data.desi.lbl.gov/doc/releases/dr1/vac/agnqso/ for details.
