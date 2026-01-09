# IRAS Point Source Catalog Redshift (PSCz)

It has been converted to UniverseViewer data format using the `extract.py` script.

The following filtering has been made on original catalog:
- Radial velocity convertion to get redshift
- Negative or null redshift entries removed

The result has been compressed with:
```
gzip -c pscz.dat > pscz.gz
```

To run the conversion script, you have to download the `VII_221_pscz.dat.gz.fits` file from http://cdsarc.u-strasbg.fr/viz-bin/Cat?VII/221 URL.

## Acknowledgments

Saunders W., Sutherland W.J., Maddox S.J., Keeble O., Oliver S.J., Rowan-Robinson M., McMahon R.G., Efstathiou G.P., Tadros H., White S.D.M., Frenk C.S., Carraminana A., Hawkins M.R.S.

## References

- [IRASPSCZ - IRAS Point Source Catalog Redshift (PSCz) Catalog](https://heasarc.gsfc.nasa.gov/w3browse/all/iraspscz.html)
- [PSCz catalog : VII/221](http://cdsarc.u-strasbg.fr/viz-bin/Cat?VII/221)
