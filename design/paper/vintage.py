"""Vintage poster paper: a seamless multiply tile (white = no change) for the page grain.

python3 design/paper/vintage.py  ->  public/images/paper-vintage.webp

Uncoated poster stock, as seen under a scanner: a soft cloudy formation (mottle), short
pale and dark fibres, and a few specks. Built from SciPy / scikit-image primitives with
wrap-around filtering, so the tile repeats without seams. It only darkens (multiply), never
adds a colour: the paper colour itself stays the palette's paper token.
"""
import pathlib
import numpy as np
from PIL import Image
from scipy import ndimage
from skimage.draw import line_aa, disk

N = 1536                                  # tile size in device px: 768 CSS px at 2× (background-size 768px)
rng = np.random.default_rng(1974)
root = pathlib.Path(__file__).resolve().parents[2]

def wrap_noise(sigma):
    f = ndimage.gaussian_filter(rng.standard_normal((N, N)), sigma, mode='wrap')
    return (f - f.mean()) / f.std()

# Formation: large soft clouds plus a finer tooth.
dark = .030 * np.clip(wrap_noise(96) * .7 + wrap_noise(28) * .3, -2.5, 2.5) / 2.5
dark += .022 * np.clip(wrap_noise(2.2), -3, 3) / 3

def stroke(layer, n, length, width, amount):
    """Short, slightly curved fibres, drawn with anti-aliased lines, wrapped at the edges."""
    for _ in range(n):
        x, y, a = rng.uniform(0, N), rng.uniform(0, N), rng.uniform(0, np.pi)
        L = rng.uniform(*length); bend = rng.uniform(-.6, .6)
        pts = []
        for t in np.linspace(-.5, .5, 6):
            ang = a + bend * t
            pts.append((x + np.cos(ang) * L * t, y + np.sin(ang) * L * t))
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            for dx in (-N, 0, N):
                for dy in (-N, 0, N):
                    rr, cc, val = line_aa(int(y0 + dy), int(x0 + dx), int(y1 + dy), int(x1 + dx))
                    ok = (rr >= 0) & (rr < N) & (cc >= 0) & (cc < N)
                    layer[rr[ok], cc[ok]] = np.maximum(layer[rr[ok], cc[ok]], val[ok] * amount)
    return ndimage.gaussian_filter(layer, width, mode='wrap') * (1 + width)

# Fibres kept faint: fewer and lighter than a first draft (user, 2026-10-27).
fibres_dark = stroke(np.zeros((N, N)), 220, (12, 44), .7, .045)
fibres_light = stroke(np.zeros((N, N)), 160, (16, 52), 1.0, .03)
specks = np.zeros((N, N))
for _ in range(40):
    r = rng.uniform(.8, 2.6); y, x = rng.uniform(0, N, 2)
    rr, cc = disk((y, x), r, shape=(N, N)); specks[rr, cc] = rng.uniform(.12, .32)
specks = ndimage.gaussian_filter(specks, 1.0, mode='wrap')

darkening = np.clip(dark + fibres_dark + specks - fibres_light, -.06, .4)
tile = np.clip(1 - darkening - .02, 0, 1)        # mean slightly below white: the sheet reads as paper
out = root / 'public' / 'images' / 'paper-vintage.webp'      # lossy WebP: the grain is noise anyway
Image.fromarray(np.round(tile * 255).astype(np.uint8), 'L').convert('RGB').save(out, quality=80, method=6)
print('wrote', out, f'mean {tile.mean():.3f} min {tile.min():.3f}')
