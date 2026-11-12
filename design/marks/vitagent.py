"""VITAgent artifact mark: a gauze pad held between two forceps, reduced to a few
overlapping flat ink blocks, after a postcard print rather than a photograph.

python3 design/marks/vitagent.py   (Pillow + NumPy)
Reference: a photo the user shared on 2026-11-12 of a gauze pad held between two
forceps (third-party image, not kept in the repository).

The pad is a vermilion tint; its folded end a blue tint laid over it, so the
fold shows as overprint. The forceps are blue, each half in its own tone (one solid,
one tint) so the two halves read apart where they cross: ring-handled forceps
from below as two disc-and-wedge blocks, thumb forceps from above as two arms. Only ink densities are drawn here: the site's
print pipeline does the screening, transfer and registration afterwards.
"""
import numpy as np
from PIL import Image, ImageDraw
from plates import write

W, H, SS = 720, 440, 4                      # sheet, supersampling

def layer():
    im = Image.new('L', (W*SS, H*SS), 0); return im, ImageDraw.Draw(im)

def done(im):
    return np.asarray(im.resize((W, H), Image.LANCZOS), np.float32)/255

def block(cx, cy, w, h, angle, r):
    """A rounded rectangle centred at (cx, cy), turned by angle degrees."""
    big = Image.new('L', (int(w*SS*1.6), int(w*SS*1.6)), 0)
    d = ImageDraw.Draw(big); bw, bh = big.size
    d.rounded_rectangle(((bw - w*SS)/2, (bh - h*SS)/2, (bw + w*SS)/2, (bh + h*SS)/2), radius=r*SS, fill=255)
    big = big.rotate(angle, resample=Image.BICUBIC)
    im, _ = layer(); im.paste(big, (int(cx*SS - bw/2), int(cy*SS - bh/2)), big); return done(im)

def bar(p0, p1, w0, w1):
    """A straight bar from p0 (width w0) tapering to p1 (width w1): one forceps."""
    (x0, y0), (x1, y1) = p0, p1
    dx, dy = x1 - x0, y1 - y0; n = np.hypot(dx, dy); nx, ny = -dy/n, dx/n
    pts = [(x0 + nx*w0/2, y0 + ny*w0/2), (x1 + nx*w1/2, y1 + ny*w1/2),
           (x1 - nx*w1/2, y1 - ny*w1/2), (x0 - nx*w0/2, y0 - ny*w0/2)]
    im, d = layer(); d.polygon([(x*SS, y*SS) for x, y in pts], fill=255); return done(im)

def disc(cx, cy, r):
    im, d = layer(); d.ellipse(((cx - r)*SS, (cy - r)*SS, (cx + r)*SS, (cy + r)*SS), fill=255); return done(im)

TONES = (1.0, .45)      # the two halves of each instrument: one solid, one a light tint

def tweezers(back, tip, spread, w):
    """Thumb forceps: two arms joined at the back, opening a little toward the tip.
    Returns one density layer per arm, each in its own tone."""
    (x0, y0), (x1, y1) = back, tip
    dx, dy = x1 - x0, y1 - y0; n = np.hypot(dx, dy); nx, ny = -dy/n, dx/n
    cap = bar((x0 - dx/n*w*.6, y0 - dy/n*w*.6), (x0 + dx/n*w*1.4, y0 + dy/n*w*1.4), w*2.1, w*2.1)
    return [t*np.maximum(bar((x0 + k*nx*w*.5, y0 + k*ny*w*.5), (x1 + k*nx*spread, y1 + k*ny*spread), w, w*.45), cap*(t == 1))
            for k, t in zip((-1, 1), TONES)]

def hemostat(handles, tip, w):
    """Ring-handled forceps as two blocks: each half a solid disc for its finger ring
    and a long wedge to the jaw. The halves cross, so their tints overlap."""
    halves = []
    for (hx, hy), k, t in zip(handles, (1, -1), TONES):
        jaw = (tip[0] + k*9, tip[1] + k*9)        # the halves swap sides: they cross before the jaw
        halves.append(t*np.maximum(disc(hx, hy, w*1.7), bar((hx, hy), jaw, w*1.25, w*.35)))
    return halves

pad = block(392, 214, 330, 132, 16, 46)            # the gauze pad
fold = block(258, 250, 150, 112, -14, 40)          # its folded end, turned back over
left = hemostat([(162, 386), (226, 400)], (338, 212), 15)   # ring-handled forceps from below left
right = tweezers((684, 76), (456, 166), 7, 10)              # thumb forceps from above right

# Three sub-plates, each with its own screen, so the elements differ in dot as well as tone:
# the pad an ellipse (chain) dot like woven gauze, the instruments square dots, the fold
# diamonds at its own angle. Shapes come from the shared Print Labs spot function.
a = np.clip(.55*pad, 0, 1)
b = np.clip(sum(left) + sum(right), 0, 1)               # tints add where the halves cross
b2 = np.clip(.42*fold, 0, 1)
write('vitagent', {'a': a, 'b': b, 'b2': b2}, 'design/marks/vitagent.py',
      screens={'a': {'shape': 'ellipse'}, 'b': {'shape': 'square'}, 'b2': {'shape': 'diamond', 'angle': 45}})
