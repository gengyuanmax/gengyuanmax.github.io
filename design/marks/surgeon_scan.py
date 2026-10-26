"""Surgeon project mark from a flatbed scan of real instruments, after a Riso
knolling print: instruments cut out, laid in aligned rows, printed in flat ink
whose tone follows the metal's own light and dark.

python3 design/marks/surgeon_scan.py   (OpenCV + NumPy; no hand-drawn geometry)
Source: design/marks/sources/gliax-instruments-scan-1.jpg (GliaX/SurgicalTools, source_pics).
"""
import cv2, numpy as np, pathlib
from plates import write

here = pathlib.Path(__file__).parent
W, H, MARGIN = 720, 440, 24

scan = cv2.imread(str(here / 'sources' / 'gliax-instruments-scan-1.jpg'))
gray = cv2.cvtColor(scan, cv2.COLOR_BGR2GRAY)

# 1. Cut out with a segmentation model (rembg, IS-Net), not a hand-tuned threshold.
from rembg import remove, new_session
rgb = cv2.cvtColor(scan, cv2.COLOR_BGR2RGB)
alpha = remove(rgb, session=new_session('isnet-general-use'), only_mask=True)
mask = (np.asarray(alpha) > 127).astype(np.uint8) * 255
mask[1480:] = 0                                                     # ruler
# Fill small holes (scan speckle in the metal), keep the finger rings open.
holes = cv2.bitwise_not(mask); n, lab, st, _ = cv2.connectedComponentsWithStats(holes)
for i in range(1, n):
    if st[i, 4] < 8000: mask[lab == i] = 255   # finger rings are ~20k px

# 2. Separate instruments (one connected component each).
n, lab, st, _ = cv2.connectedComponentsWithStats(mask)
parts = sorted([i for i in range(1, n) if st[i, 4] >= 8000], key=lambda i: st[i, 1])
# parts, top to bottom: 0 hemostat, 1 hemostat (reversed), 2 hemostat,
# 3 thumb forceps, 4 needle holder, 5 scalpel handle
GROUPS = {'hemostat': [2], 'forceps': [3], 'scalpel': [5], 'hemostat_closed': [1]}

def straighten(labels):
    m = np.isin(lab, [parts[k] for k in labels]).astype(np.uint8)
    ys, xs = np.nonzero(m); pts = np.column_stack([xs, ys]).astype(np.float32)
    # Principal axis (bisects open jaws, unlike a bounding box).
    mean, vecs = cv2.PCACompute(pts, mean=None); (cx, cy) = mean[0]
    ang = np.degrees(np.arctan2(vecs[0, 1], vecs[0, 0]))
    R = cv2.getRotationMatrix2D((cx, cy), ang, 1)
    size = (scan.shape[1] * 2, scan.shape[0] * 2); R[:, 2] += (size[0] / 2 - cx, size[1] / 2 - cy)
    mm = cv2.warpAffine(m * 255, R, size, flags=cv2.INTER_LINEAR)
    gg = cv2.warpAffine(gray, R, size, flags=cv2.INTER_LINEAR)
    y0, y1 = np.nonzero(mm.max(1))[0][[0, -1]]; x0, x1 = np.nonzero(mm.max(0))[0][[0, -1]]
    mm, gg = mm[y0:y1 + 1, x0:x1 + 1], gg[y0:y1 + 1, x0:x1 + 1]
    half = mm.shape[1] // 2                                         # handle = the heavier end, to the left
    if mm[:, half:].sum() > mm[:, :half].sum(): mm, gg = mm[:, ::-1], gg[:, ::-1]
    return dict(mask=mm / 255, gray=gg, length=mm.shape[1])

items = {k: straighten(v) for k, v in GROUPS.items()}
print('instruments:', {k: (it['length'], it['mask'].shape[0]) for k, it in items.items()})

# 3. Choose the set and inks (top to bottom in the layout).
pick = [('hemostat', 'b'), ('forceps', 'a'), ('scalpel', 'a'), ('hemostat_closed', 'b')]
rows = [items[k] | {'ink': ink} for k, ink in pick]
# Knolling, standing up: handles at the top on one line, true relative sizes,
# equal gaps between instruments, the group centred on the sheet.
GAP = 46
L = max(r['length'] for r in rows)
scale = (H - 2 * MARGIN) / L
widths = [int(round(r['mask'].shape[0] * scale)) for r in rows]
x = (W - sum(widths) - GAP * (len(rows) - 1)) // 2
A, B = np.zeros((H, W), np.float32), np.zeros((H, W), np.float32)
photo = np.full((H, W), 255, np.float32)   # the same layout as a photo, for the illustration step
for r, w in zip(rows, widths):
    h = int(round(r['length'] * scale))
    m = cv2.resize(r['mask'].T.astype(np.float32), (w, h), interpolation=cv2.INTER_AREA)
    g = cv2.resize(np.ascontiguousarray(r['gray'].T), (w, h), interpolation=cv2.INTER_AREA).astype(np.float32)
    # Riso illustration treatment (after the knolling print): flat ink fill, the
    # steel's main contours drawn back in as paper lines, a slight hand wobble.
    edges = cv2.Canny(cv2.GaussianBlur(g.astype(np.uint8), (0, 0), 1.6), 40, 110) / 255.
    inner = cv2.erode((m > .5).astype(np.uint8), np.ones((5, 5), np.uint8))
    lines = cv2.dilate(edges * inner, np.ones((2, 2), np.uint8))
    dens = m * (1 - .9 * lines)   # solid ink, as a Riso flat
    region = photo[MARGIN:MARGIN + h, x:x + w]; region[:] = region * (1 - m) + g * m
    plate = A if r['ink'] == 'a' else B
    plate[MARGIN:MARGIN + h, x:x + w] = np.maximum(plate[MARGIN:MARGIN + h, x:x + w], dens)
    x += w + GAP

# Hand wobble: one smooth displacement field (a few px) shared by both plates.
rng = np.random.default_rng(3)
def field():
    f = cv2.resize(rng.standard_normal((9, 15)).astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    return f / np.abs(f).max() * 2.2
gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
fx, fy = gx + field(), gy + field()
A, B = (cv2.remap(p, fx, fy, cv2.INTER_LINEAR) for p in (A, B))
cv2.imwrite(str(here / 'sources' / 'surgeon-layout.png'), cv2.resize(photo, (W * 2, H * 2), interpolation=cv2.INTER_CUBIC).astype(np.uint8))
write('surgeon', {'a': A, 'b': B}, 'design/marks/surgeon_scan.py')
