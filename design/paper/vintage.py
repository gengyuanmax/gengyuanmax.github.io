"""Vintage poster paper: a seamless multiply tile (white = no change) for the page grain.

python3 design/paper/vintage.py  ->  public/images/paper-vintage.webp

Uncoated poster stock seen at screen distance is mostly felt, not hairs: a dense mat of tiny
fibres gives a fine tooth and a cloudy flocculation a few millimetres across; only a few
longer fibres and specks stand out, faintly. The tile is built that way from SciPy /
scikit-image primitives with wrap-around filtering (seamless), large enough (1024 CSS px)
that its repeat is not seen on big screens. It only darkens (multiply), never adds a
colour: the paper colour stays the palette's paper token.
"""
import pathlib
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.draw import line_aa, disk

N = 2048                                  # device px: 1024 CSS px at 2× (background-size 1024px)
rng = np.random.default_rng(1974)
root = pathlib.Path(__file__).resolve().parents[2]

def wrap_noise(sigma):
    f = ndimage.gaussian_filter(rng.standard_normal((N, N)), sigma, mode='wrap')
    return (f - f.mean()) / f.std()

def fibres(n, length, amount, blur):
    """Additive mat of short, slightly curved anti-aliased fibres, wrapped at the tile edges."""
    layer = np.zeros((N, N))
    for _ in range(n):
        x, y, a = rng.uniform(0, N), rng.uniform(0, N), rng.uniform(0, np.pi)
        L = rng.uniform(*length); bend = rng.uniform(-.5, .5); w = amount * rng.uniform(.5, 1)
        ts = np.linspace(-.5, .5, 4)
        pts = [(x + np.cos(a + bend * t) * L * t, y + np.sin(a + bend * t) * L * t) for t in ts]
        near = x < L or y < L or x > N - L or y > N - L
        shifts = [(dx, dy) for dx in (-N, 0, N) for dy in (-N, 0, N)] if near else [(0, 0)]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            for dx, dy in shifts:
                rr, cc, val = line_aa(int(y0 + dy), int(x0 + dx), int(y1 + dy), int(x1 + dx))
                ok = (rr >= 0) & (rr < N) & (cc >= 0) & (cc < N)
                np.add.at(layer, (rr[ok], cc[ok]), val[ok] * w)
    return ndimage.gaussian_filter(layer, blur, mode='wrap')

# Flocculation: soft clouds a few mm across, and a weaker very large drift.
floc = .012 * np.clip(wrap_noise(10) * .6 + wrap_noise(26) * .4, -3, 3) / 3 + .006 * np.clip(wrap_noise(120), -3, 3) / 3
# Tooth: the surface's finest grain.
tooth = .014 * np.clip(wrap_noise(.8), -3, 3) / 3
# Felt: thousands of tiny fibres, too small to read as hairs; a few longer ones, faint.
felt = fibres(9000, (5, 16), .035, .5)
long_fibres = fibres(30, (30, 70), .022, .7)
specks = np.zeros((N, N))
for _ in range(14):
    r = rng.uniform(.8, 1.8); y, x = rng.uniform(0, N, 2)
    rr, cc = disk((y, x), r, shape=(N, N)); specks[rr, cc] = rng.uniform(.10, .22)
specks = ndimage.gaussian_filter(specks, 1.0, mode='wrap')

darkening = np.clip(floc + tooth + felt + long_fibres + specks, -.03, .3)
tile = np.clip(1 - darkening - .012, 0, 1)       # mean slightly below white: the sheet reads as paper
out = root / 'public' / 'images' / 'paper-vintage.webp'      # lossy WebP: the grain is noise anyway
Image.fromarray(np.round(tile * 255).astype(np.uint8), 'L').convert('RGB').save(out, quality=80, method=6)
print('wrote', out, f'mean {tile.mean():.3f} min {tile.min():.3f}')
