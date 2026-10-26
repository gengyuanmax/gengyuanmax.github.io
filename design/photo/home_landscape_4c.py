"""Four-ink separation of the home "mountain and person" image, as a Riso print is made:
from the inks and their overprints, not from the photo's continuous colour.

python3 design/photo/home_landscape_4c.py  ->  src/assets/home/landscape-4c/{,figure-}{a,b,c,d}.png

Inks: a vermilion, b blue, c yellow, d dark. Every plate uses only four levels,
0 / 35 / 70 / 100 %; a colour on the sheet is one of those levels per ink, overprinted
(at most two inks at once). Each region of the picture is given the inks it may use, so
the region's colours come from a small, fixed overprint palette:

  sky     blue 35 %, fading out towards the top (the one gradient, like the reference poster)
  clouds  paper
  rock    blue tints, dark only in the deepest shadow   -> a cool blue mountain
  forest  blue over yellow                              -> green
  person  vermilion over yellow for skin and jacket, dark for hair and shirt, blue plaid;
          the head from the earlier one-pass mapping (the approved face);
          the person has plates of his own, printed on the 2px fine screen
(the swatch lists are SWATCHES below)

The photo supplies only shapes and light/dark: each region is reduced to a few colours
(scikit-learn k-means in CIELAB, after an edge-preserving smoothing), and each colour is
replaced by the nearest swatch of that region's overprint palette (CIEDE2000 distance,
scikit-image). A mode filter then cleans the swatch map into flat shapes. Plates are
ink-density maps (alpha 0..1); scripts/render-home-landscape.mjs screens, transfers and
composites them with the shared print pipeline.
"""
import json, pathlib, subprocess
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from sklearn.cluster import MiniBatchKMeans
from skimage import color, exposure, measure, morphology, restoration

root = pathlib.Path(__file__).resolve().parents[2]
node = lambda js: json.loads(subprocess.check_output(['node', '--experimental-strip-types', '-e', js], cwd=root, stderr=subprocess.DEVNULL))
L = node("import('./src/config/home-landscape.ts').then(m=>console.log(JSON.stringify(m.homeLandscape)))")
P = node("import('./src/design/settings.ts').then(m=>{const c=JSON.parse(require('fs').readFileSync('src/config/design.json','utf8'));console.log(JSON.stringify(m.getPalette(c,m.resolve(c,'home').values.palette)))})")

k = L['scale']; W, H, BH = L['width'] * k, L['height'] * k, L['band']['height'] * k; top = H - BH
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255
INKS = 'abcd'
INK_RGB = np.stack([hexrgb(P['secondary']), hexrgb(P['primary']), hexrgb(P['yellow']), hexrgb(P['dark'])])
LEVELS = (0, .35, .7, 1)

def swatch(spec):
    """'a35+c70' -> densities; 'paper' -> no ink. Levels must be plate levels."""
    d = np.zeros(4, np.float32)
    for part in ([] if spec == 'paper' else spec.split('+')):
        level = int(part[1:]) / 100; assert level in LEVELS, part; d[INKS.index(part[0])] = level
    return d

def palette(specs):
    """A region's swatches: densities (n, 4) and their printed colour in Lab (n, 3)."""
    dens = np.array([swatch(s) for s in specs])
    rgb = np.prod(1 - dens[:, :, None] * (1 - INK_RGB[None]), axis=1)      # subtractive overprint on white
    return dens, color.rgb2lab(rgb[None])[0]

def to_swatches(rgb, mask, specs, n_colors, seed):
    """Map the masked pixels to the nearest swatch of the region's overprint palette."""
    dens, pal = palette(specs)
    lab = color.rgb2lab(rgb)[mask]
    km = MiniBatchKMeans(n_colors, random_state=seed, n_init=3, batch_size=4096).fit(lab)
    # Spread the region's lightness over the palette's range so it uses light and dark swatches.
    lo, hi = np.percentile(lab[:, 0], [3, 97]); plo, phi = pal[:, 0].min(), pal[:, 0].max()
    centres = km.cluster_centers_.copy(); centres[:, 0] = np.interp(centres[:, 0], [lo, hi], [plo, phi])
    dist = color.deltaE_ciede2000(centres[:, None], pal[None])
    choice = dist.argmin(1)[km.labels_]
    out = np.full(mask.shape, -1, np.int32); out[mask] = choice
    return out, dens

def flatten(labels, mask, size):
    """Mode filter: every pixel takes the most common swatch around it, inside the region."""
    smooth = np.asarray(Image.fromarray(np.where(mask, labels + 1, 0).astype(np.uint8)).filter(ImageFilter.ModeFilter(size))).astype(np.int32) - 1
    # Region edges where the mode was "outside": take the nearest swatch, never leave paper gaps.
    holes = mask & (smooth < 0)
    if holes.any():
        _, (iy, ix) = ndimage.distance_transform_edt(smooth < 0, return_indices=True)
        smooth[holes] = smooth[iy[holes], ix[holes]]
    return np.where(mask, smooth, -1)

def place(region_dens, labels, mask, target):
    m = mask & (labels >= 0)
    target[m] = region_dens[labels[m]]

def smooth_rgb(rgb):
    """Edge-preserving smoothing, so regions break into shapes rather than texture."""
    return np.clip(restoration.denoise_tv_chambolle(rgb, weight=.08, channel_axis=-1), 0, 1)

# ---------------------------------------------------------------- landscape
src = L['band']['source']
band = Image.open(root / L['mountain']).convert('RGB').crop((src['left'], src['top'], src['left'] + src['width'], src['top'] + src['height']))
band = np.asarray(band.resize((W, BH), Image.LANCZOS), np.float32) / 255
hsv = color.rgb2hsv(band)
clean = lambda m: morphology.remove_small_holes(morphology.remove_small_objects(morphology.opening(m, morphology.disk(2)), max_size=3999), max_size=3999)
sky = clean((hsv[..., 0] > .52) & (hsv[..., 0] < .7) & (hsv[..., 1] > .3) & (hsv[..., 2] > .45))
forest = clean(~sky & (hsv[..., 2] < .36)) & ~sky
bright = clean((hsv[..., 2] > .7) & (hsv[..., 1] < .2)) & ~sky
lab_ = measure.label(bright); near_sky = morphology.dilation(sky, morphology.disk(6))
clouds = np.zeros_like(sky)
for r in measure.regionprops(lab_):
    if r.centroid[0] < .6 * BH and near_sky[lab_ == r.label].any(): clouds |= lab_ == r.label
clouds = morphology.dilation(clouds, morphology.disk(9)) & (hsv[..., 2] > .5) & ~sky
rock = ~sky & ~clouds & ~forest

lab = color.rgb2lab(band); lab[..., 0] = exposure.equalize_adapthist(lab[..., 0] / 100, clip_limit=.02) * 100
shaped = smooth_rgb(np.clip(color.lab2rgb(lab), 0, 1))
m = np.zeros((BH, W, 4), np.float32)
# Each region's swatches, light to dark: the designer's choice of inks and overprints.
SWATCHES = {
    'rock':   ['paper', 'b35', 'b70', 'b100', 'b100+d35'],
    'forest': ['b35+c35', 'b35+c70', 'b70+c70', 'b100+c35', 'b100+d70'],
    'person': ['paper', 'c35', 'a35+c35', 'a35+c70', 'a70+d35', 'b70', 'd70', 'd100'],
    'face':   ['paper', 'c35', 'a35+c35', 'a35+c70', 'a70+c70', 'a70+d35', 'b70', 'd70', 'd100'],
}
for name, mask, n, mode in [('rock', rock, 6, 9), ('forest', forest, 5, 7)]:
    labels, dens = to_swatches(shaped, mask, SWATCHES[name], n, seed=len(name))
    place(dens, flatten(labels, mask, mode), mask, m)
# Sky: one flat blue tint that fades out upwards; clouds stay paper.
y = np.linspace(0, 1, BH, dtype=np.float32)[:, None]
smoothstep = lambda t: (lambda u: u * u * (3 - 2 * u))(np.clip(t, 0, 1))
m[..., 1] = np.where(sky, LEVELS[1] * smoothstep((y - .02) / .53), m[..., 1])
# The mountain itself starts just below the sheet's upper edge of the band.
m *= np.where(sky, 1, smoothstep((y - .08) / .1))[..., None]
plates = np.zeros((H, W, 4), np.float32); plates[top:] = m

# ---------------------------------------------------------------- person
cut = Image.open(root / L['personSource']).convert('RGBA')
ph = round(H * L['placement']['height']); pw = round(ph * cut.width / cut.height)
px, py = round(W * L['placement']['x'] - pw / 2), H - ph
cut = cut.resize((pw, ph), Image.LANCZOS)          # the approved cutout's own matte, uncut
person = np.asarray(cut, np.float32) / 255
alpha = person[..., 3]; inside = alpha > .5
plab = color.rgb2lab(person[..., :3]); plab[..., 0] = exposure.equalize_adapthist(plab[..., 0] / 100, clip_limit=.015) * 100
prgb = smooth_rgb(np.clip(color.lab2rgb(plab), 0, 1))
# Head and body are drawn separately. The head ends at the neck: the narrowest row of
# the matte below its top (scipy.signal.find_peaks on the smoothed width profile).
from scipy.signal import find_peaks
width = ndimage.uniform_filter1d(inside.sum(1).astype(float), max(3, ph // 70))
crown = int(np.nonzero(width)[0][0]); search = width[crown:crown + ph // 2]
neck = crown + int(find_peaks(-search, prominence=search.max() * .05)[0][0]) + ph // 80
head = inside & (np.arange(ph)[:, None] < neck); body = inside & ~head

pd = np.zeros((ph, pw, 4), np.float32)
labels, dens = to_swatches(prgb, body, SWATCHES['person'], 8, seed=7)
place(dens, flatten(labels, body, 9), body, pd)

# Head: the face as the user approved it (2026-10-26) - the whole figure mapped to the
# person swatches in one pass (with the heavier vermilion-over-yellow tone), lightly
# cleaned; only the head region of that mapping is kept.
labels, dens = to_swatches(prgb, inside, SWATCHES['face'], 8, seed=7)
place(dens, flatten(labels, inside, 5), head, pd)

# The person is cut out of the landscape plates and kept on plates of his own: he prints
# on the fine screen (2px), the landscape on the image screen (4px).
x0, x1 = max(px, 0), min(px + pw, W); sx = x0 - px
a = inside[:, sx:sx + x1 - x0, None]
plates[py:py + ph, x0:x1] = np.where(a, 0, plates[py:py + ph, x0:x1])
figure = np.zeros_like(plates); figure[py:py + ph, x0:x1] = np.where(a, pd[:, sx:sx + x1 - x0], 0)

# ---------------------------------------------------------------- output
out = root / L['plates']; out.mkdir(parents=True, exist_ok=True)
for prefix, layer in (('', plates), ('figure-', figure)):
    for i, ink in enumerate(INKS):
        img = np.zeros((H, W, 4), np.uint8); img[..., 3] = np.round(np.clip(layer[..., i], 0, 1) * 255)
        Image.fromarray(img).save(out / f'{prefix}{ink}.png', optimize=True)
used = {tuple(v) for v in (plates + figure).reshape(-1, 4)[::97]}
print('distinct ink combinations on the sheet (sampled):', len(used))
