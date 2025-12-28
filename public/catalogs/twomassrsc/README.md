# TWOMASSRSC - 2MASS Redshift Survey (2MRS) Catalog

It has been converted to UniverseViewer data format using the `extract.py` script.

The following filtering has been made on original catalog:
- Radial velocity convertion to get redshift
- Negative redshift entries removed

The result has been compressed with:
```
gzip -c 2mrs.dat > 2mrs.gz
```

To run the conversion script, you have to download the table 3 `J_ApJS_199_26_table3.dat.gz.fits` file from https://cdsarc.cds.unistra.fr/viz-bin/cat/J/ApJS/199/26#/browse URL.

## Acknowledgments

The 2MASS Redshift Survey - Description and Data Release

Huchra J.P., Macri L.M., Masters K.L., Jarrett T.H., Berlind P.,\
Calkins M., Crook A.C., Cutri R., Erdogdu P., Falco E., George T.,\
Hutcheson C.M., Lahav O., Mader J., Mink J.D., Martimbeau N.,\
Schneider S., Skrutskie M., Tokarz S., Westover M.\
\<Astrophys. J. Suppl. 199, 26 (2012)\>

## References

- [TWOMASSRSC - 2MASS Redshift Survey (2MRS) Catalog](https://heasarc.gsfc.nasa.gov/W3Browse/all/twomassrsc.html)
