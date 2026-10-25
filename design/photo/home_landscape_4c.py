"""Four-ink separation of the home "mountain and person" image.

python3 design/photo/home_landscape_4c.py  ->  src/assets/home/landscape-4c/{a,b,c,d}.png

Inks: a vermilion, b blue, c yellow, d dark. Each plate is an ink-density map
(alpha 0..1) at the sheet's render size; scripts/render-home-landscape.mjs screens,
transfers and composites them with the shared print pipeline.

Separation is physical, solved with SciPy, not hand-written thresholds: printed colour
is paper × Π(1 − dᵢ(1 − inkᵢ)), which is linear in optical density, so each colour's
densities are a bounded least-squares fit (scipy.optimize.lsq_linear) with a small cost
per ink. The photo is first reduced to a few hundred colours (scikit-learn k-means)
so only those are solved. Region recipes only set the per-ink costs:
  mountain  dark ink is expensive (it would turn the rock grey and heavy);
  person    blue is expensive on skin and jacket, dark is cheap for hair and the black shirt.
The person's matte is refined with rembg so the cutout's orange halo does not print.
"""
import json, pathlib, subprocess
import numpy as np
from PIL import Image
from scipy.optimize import lsq_linear
from sklearn.cluster import MiniBatchKMeans
from skimage import color, exposure

root = pathlib.Path(__file__).resolve().parents[2]
node = lambda js: json.loads(subprocess.check_output(['node', '--experimental-strip-types', '-e', js], cwd=root, stderr=subprocess.DEVNULL))
L = node("import('./src/config/home-landscape.ts').then(m=>console.log(JSON.stringify(m.homeLandscape)))")
P = node("import('./src/design/settings.ts').then(m=>{const c=JSON.parse(require('fs').readFileSync('src/config/design.json','utf8'));console.log(JSON.stringify(m.getPalette(c,m.resolve(c,'home').values.palette)))})")

k = L['scale']; W, H, BH = L['width'] * k, L['height'] * k, L['band']['height'] * k; top = H - BH
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255
INKS = {'a': hexrgb(P['secondary']), 'b': hexrgb(P['primary']), 'c': hexrgb(P['yellow']), 'd': hexrgb(P['dark'])}
OD = np.stack([-np.log(np.clip(v, .02, 1)) for v in INKS.values()], 1)          # 3 × 4

def separate(rgb, cost, n_colors, seed=0):
    """rgb: (N, 3) in 0..1 -> densities (N, 4) for inks a, b, c, d.
    A small n_colors posterises the image into flat tones, as a screenprint would be cut."""
    km = MiniBatchKMeans(n_colors, random_state=seed, n_init=3, batch_size=4096).fit(color.rgb2lab(rgb[None])[0])
    centres = np.clip(color.lab2rgb(km.cluster_centers_[None])[0], 0, 1)
    A = np.vstack([OD, np.diag(cost)])
    dens = np.array([lsq_linear(A, np.concatenate([-np.log(np.clip(c, .02, 1)), np.zeros(4)]), bounds=(0, 1)).x
                     for c in centres])
    return dens[km.labels_]

def poster(rgb, sat=1.3, gamma=.9):
    """A little more colour and contrast, as a Riso poster would be drawn."""
    hsv = color.rgb2hsv(rgb); hsv[..., 1] = np.clip(hsv[..., 1] * sat, 0, 1)
    return exposure.adjust_gamma(color.hsv2rgb(hsv), gamma)

# Mountain band (bottom of the sheet), same crop as the two-ink version.
src = L['band']['source']
band = Image.open(root / L['mountain']).convert('RGB').crop((src['left'], src['top'], src['left'] + src['width'], src['top'] + src['height']))
band = np.asarray(band.resize((W, BH), Image.LANCZOS), np.float32) / 255
plates = np.zeros((H, W, 4), np.float32)
# Regions from the untouched photo: sky = saturated blue and bright, forest = dark.
hsv = color.rgb2hsv(band)
sky = (hsv[..., 0] > .52) & (hsv[..., 0] < .7) & (hsv[..., 1] > .3) & (hsv[..., 2] > .45)
forest = ~sky & (hsv[..., 2] < .36)
from skimage import morphology
clean = lambda m: morphology.remove_small_holes(morphology.remove_small_objects(morphology.opening(m, morphology.disk(2)), 4000), 4000)
sky, forest = clean(sky), clean(forest) & ~clean(sky)
# Clouds: bright, unsaturated blobs touching the sky in the upper half; they print as paper.
from skimage import measure
bright = clean((hsv[..., 2] > .7) & (hsv[..., 1] < .2)) & ~sky
lab_ = measure.label(bright); near_sky = morphology.binary_dilation(sky, morphology.disk(6))
clouds = np.zeros_like(sky)
for r in measure.regionprops(lab_):
    if r.centroid[0] < .6 * BH and near_sky[lab_ == r.label].any(): clouds |= lab_ == r.label
# Their soft grey rims too: grow into neighbouring light pixels, never into dark rock.
clouds = morphology.binary_dilation(clouds, morphology.disk(9)) & (hsv[..., 2] > .5) & ~sky
# Rock relief: adaptive histogram equalisation (CLAHE) on lightness only.
lab = color.rgb2lab(band); lab[..., 0] = exposure.equalize_adapthist(lab[..., 0] / 100, clip_limit=.02) * 100
band = np.clip(color.lab2rgb(lab), 0, 1)
# Landscape regions use gradient maps (lightness -> ink densities), the usual way a
# Riso print assigns an ink to each part of a picture (here a cool landscape: blue rock,
# blue-yellow forest, so the warm figure stands out); the person keeps a physical
# separation because his colours (skin, jacket, black shirt) should read as themselves.
RAMPS = {  # stops: lightness, (a vermilion, b blue, c yellow, d dark)
    'sky':    [(0, (0, .3, 0, 0)), (.6, (0, .18, 0, 0)), (1, (0, .02, 0, 0))],
    'forest': [(0, (0, .85, .55, .45)), (.25, (0, .7, .6, .15)), (.5, (0, .5, .55, 0)), (1, (0, .12, .25, 0))],
    'clouds': [(0, (0, .12, 0, 0)), (1, (0, 0, 0, 0))],
    'rock':   [(0, (0, .85, 0, .5)), (.3, (0, .7, 0, .12)), (.55, (0, .45, 0, 0)), (.8, (0, .16, .06, 0)), (1, (0, 0, 0, 0))],
}
def gradient_map(lightness, stops):
    xs = [p for p, _ in stops]
    return np.stack([np.interp(lightness, xs, [v[i] for _, v in stops]) for i in range(4)], -1)
light = np.clip(lab[..., 0] / 100, 0, 1)
m = np.zeros((BH, W, 4), np.float32)
for name, where in [('sky', sky), ('clouds', clouds), ('forest', forest), ('rock', ~sky & ~clouds & ~forest)]:
    m[where] = gradient_map(light[where], RAMPS[name])
# The band rises out of the paper: fade in over its upper part (sky further than rock).
y = np.linspace(0, 1, BH, dtype=np.float32)[:, None]
smooth = lambda t: (lambda u: u * u * (3 - 2 * u))(np.clip(t, 0, 1))
fade = np.where(sky | clouds, smooth((y - .02) / .53) ** 1.4, smooth((y - .08) / .22))
plates[top:] = m * fade[..., None]

# Person, bottom-aligned at the configured place, in front of the mountain.
cut = Image.open(root / L['personSource']).convert('RGBA')
ph = round(H * L['placement']['height']); pw = round(ph * cut.width / cut.height)
px, py = round(W * L['placement']['x'] - pw / 2), H - ph
from rembg import remove, new_session
on_white = Image.alpha_composite(Image.new('RGBA', cut.size, 'white'), cut).convert('RGB')
refined = np.minimum(np.asarray(cut)[..., 3], np.asarray(remove(on_white, session=new_session('isnet-general-use'), only_mask=True)))
from scipy import ndimage
refined = ndimage.grey_erosion(refined, size=(7, 7))   # pull the matte inside the old cutout's warm fringe
cut = Image.fromarray(np.dstack([np.asarray(cut)[..., :3], refined])).resize((pw, ph), Image.LANCZOS)
person = np.asarray(cut, np.float32) / 255
alpha = person[..., 3:4]
plab = color.rgb2lab(person[..., :3]); plab[..., 0] = exposure.equalize_adapthist(plab[..., 0] / 100, clip_limit=.015) * 100
prgb = np.clip(color.lab2rgb(plab), 0, 1)   # local contrast so the face keeps its features
pd = separate(poster(prgb, sat=1.2, gamma=1.1).reshape(-1, 3), cost=np.array([.03, .5, .03, .06]), n_colors=14, seed=7).reshape(ph, pw, 4)
x0, x1 = max(px, 0), min(px + pw, W); sx = x0 - px
region = plates[py:py + ph, x0:x1]
plates[py:py + ph, x0:x1] = region * (1 - alpha[:, sx:sx + x1 - x0]) + pd[:, sx:sx + x1 - x0] * alpha[:, sx:sx + x1 - x0]

out = root / 'src' / 'assets' / 'home' / 'landscape-4c'; out.mkdir(parents=True, exist_ok=True)
for i, ink in enumerate('abcd'):
    img = np.zeros((H, W, 4), np.uint8); img[..., 3] = np.round(np.clip(plates[..., i], 0, 1) * 255)
    Image.fromarray(img).save(out / f'{ink}.png', optimize=True)
    print(ink, 'mean density', round(float(plates[..., i].mean()), 3))
