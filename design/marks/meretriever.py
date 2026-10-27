"""Me-Retriever / MeVTR project mark: two modalities as two perforated strips.

python3 design/marks/meretriever.py   (Shapely geometry + Pillow raster; no hand-drawn pixels)

Video is a blue strip with round holes (frames); text is a vermilion strip with slotted
holes (words). Both strips are the same shape, a path along the three axes of a cube,
and each is the other turned through the centre (point reflection in 3D, i.e. 180° on
the page). Together they close into one isometric figure: two modalities that differ in
kind but share one structure. Where they meet they overprint (blue under vermilion
prints dark): the points of alignment that retrieval looks for.

Paths are written in 3D grid steps of one hole pitch and projected isometrically, so every
hole, corner and end sits on the grid and the figure is balanced by construction.
"""
import math, pathlib
import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import LineString, Point
from shapely.ops import unary_union
from plates import write

W, H, SS = 720, 440, 4                # artboard (2× of 360×220) and supersampling
WIDTH, HOLE = .9, .19                 # strip width and hole radius, in hole pitches
C, S = math.cos(math.pi / 6), math.sin(math.pi / 6)
AXES = {'x': (1, 0, 0), 'X': (-1, 0, 0), 'y': (0, 1, 0), 'Y': (0, -1, 0), 'z': (0, 0, 1), 'Z': (0, 0, -1)}

def walk(start, moves):
    """3D path: start (x, y, z) and moves like 'x5 Z3' -> list of 3D points."""
    pts = [start]
    for mv in moves.split():
        d = AXES[mv[0]]; n = int(mv[1:]); x, y, z = pts[-1]
        pts.append((x + d[0] * n, y + d[1] * n, z + d[2] * n))
    return pts

def project(p):
    x, y, z = p
    return ((x - y) * C, (x + y) * S - z)

VIDEO3D = walk((0, 0, 3), 'x5 Z3 y5 z3 X5')
lo, hi = np.min(VIDEO3D, 0), np.max(VIDEO3D, 0); centre = (lo + hi) / 2
TEXT3D = [tuple(2 * centre - np.array(p)) for p in VIDEO3D]       # the same path, turned through the centre
STRIPS = [([project(p) for p in VIDEO3D], 'round'), ([project(p) for p in TEXT3D], 'slot')]

def strip(points, hole='round'):
    line = LineString(points)
    body = line.buffer(WIDTH / 2, cap_style='round', join_style='round', quad_segs=24)
    holes = []
    for a, b in zip(points, points[1:]):
        n = round(math.dist(a, b))
        for i in range(n + 1):
            t = i / n if n else 0
            x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
            corner = i in (0, n)       # ends and corners keep a round hole, where two directions meet
            if hole == 'slot' and not corner:   # a slot along the strip: a word rather than a frame
                ux, uy = (b[0] - a[0]) / math.dist(a, b), (b[1] - a[1]) / math.dist(a, b)
                holes.append(LineString([(x - ux * .17, y - uy * .17), (x + ux * .17, y + uy * .17)]).buffer(HOLE, quad_segs=16))
            else:
                holes.append(Point(x, y).buffer(HOLE, quad_segs=16))
    return body, unary_union(holes)

def raster(geoms, fit):
    """Fill shapely polygons into a supersampled mask, then box-filter down (anti-aliased)."""
    (ox, oy, k) = fit
    img = Image.new('L', (W * SS, H * SS), 0); d = ImageDraw.Draw(img)
    tx = lambda c: [((x - ox) * k * SS, (y - oy) * k * SS) for x, y in c]
    for g in geoms:
        for poly in getattr(g, 'geoms', [g]):
            if poly.is_empty: continue
            d.polygon(tx(poly.exterior.coords), fill=255)
            for ring in poly.interiors: d.polygon(tx(ring.coords), fill=0)
    return np.asarray(img.resize((W, H), Image.BOX), np.float32) / 255

def main():
    parts = [strip(points, hole) for points, hole in STRIPS]
    holes = unary_union([h for _, h in parts])          # every hole goes through both strips
    bodies = [b.difference(holes) for b, _ in parts]
    minx, miny, maxx, maxy = unary_union(bodies).bounds
    margin = 16
    k = min((W - 2 * margin) / (maxx - minx), (H - 2 * margin) / (maxy - miny))
    fit = (minx - ((W / k) - (maxx - minx)) / 2, miny - ((H / k) - (maxy - miny)) / 2, k)
    video, text = (raster([b], fit) for b in bodies)
    write('meretriever', {'b': video, 'a': text}, 'design/marks/meretriever.py')

if __name__ == '__main__':
    main()
