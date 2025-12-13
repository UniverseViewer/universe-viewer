# The Sloan Digital Sky Survey Quasar Catalog: sixteenth data release (DR16Q)

It has been converted to UniverseViewer data format using the `extract.py` script.
The following filtering has been made on original catalog:
- no redshift warning flags.

The result has been compressed with:
```
gzip -c catalog.dat > catalog.gz
```

To run the conversion script, you have to download the `DR16Q_Superset_v3.fits` or the `DR16Q_v4.fits` file from https://www.sdss4.org/dr16/algorithms/qso_catalog/ URL.

## Acknowledgments

Funding for the Sloan Digital Sky Survey IV has been provided by the Alfred P. Sloan Foundation, the U.S. Department of Energy Office of Science, and the Participating Institutions. SDSS acknowledges support and resources from the Center for High-Performance Computing at the University of Utah. The SDSS web site is www.sdss4.org.

SDSS is managed by the Astrophysical Research Consortium for the Participating Institutions of the SDSS Collaboration including the Brazilian Participation Group, the Carnegie Institution for Science, Carnegie Mellon University, Center for Astrophysics | Harvard & Smithsonian (CfA), the Chilean Participation Group, the French Participation Group, Instituto de Astrofísica de Canarias, The Johns Hopkins University, Kavli Institute for the Physics and Mathematics of the Universe (IPMU) / University of Tokyo, the Korean Participation Group, Lawrence Berkeley National Laboratory, Leibniz Institut für Astrophysik Potsdam (AIP), Max-Planck-Institut für Astronomie (MPIA Heidelberg), Max-Planck-Institut für Astrophysik (MPA Garching), Max-Planck-Institut für Extraterrestrische Physik (MPE), National Astronomical Observatories of China, New Mexico State University, New York University, University of Notre Dame, Observatório Nacional / MCTI, The Ohio State University, Pennsylvania State University, Shanghai Astronomical Observatory, United Kingdom Participation Group, Universidad Nacional Autónoma de México, University of Arizona, University of Colorado Boulder, University of Oxford, University of Portsmouth, University of Utah, University of Virginia, University of Washington, University of Wisconsin, Vanderbilt University, and Yale University.

## References

- [Technical publications](https://www.sdss.org/science/publications/technical-publications/)
- [DR16 QSO catalog page](https://www.sdss4.org/dr16/algorithms/qso_catalog/)
- [FITS catalog format](https://data.sdss.org/datamodel/files/BOSS_QSO/DR16Q/DR16Q_v4.html)
