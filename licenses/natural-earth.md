# WikiTiLo Earth source

Land outlines: Natural Earth 1:110m land, v5.1.2 (public domain).

- Source: https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_110m_land.geojson
- Terms: https://www.naturalearthdata.com/about/terms-of-use/
- Projection: orthographic, centered at 35° E / 20° N, radius 87 SVG units.
- Conversion: d3-geo 3.1.1, precision 0.25, one decimal place. The projection library is only used offline; no new browser dependency.

`src/design/assets/earth-land.ts` stores the projected coastline; `public/images/wikitilo-earth-source.svg` is its editable grayscale source preview. Ocean ink demand is 0.32 and land ink demand is 1. The live motif applies the site's shared spherical illumination, AM screen, ink transfer and paper treatment to that source. It retains the existing circle position and blue ring composition. No country borders or geographic claims are encoded.
