"""ICQ project mark, modelled in Blender. Run: python3 design/marks/render.py icq

Scene only: geometry, camera and which ink each surface takes. The site's print
pipeline does all printing (screening, transfer, registration) afterwards.
Each material emits its ink densities as colour: R = ink A (vermilion), G = ink B (blue).
"""
import bpy

GRID = 1.4          # tile pitch
SIZE = 1.0          # tile footprint
LOW, HIGH = .3, 1.6 # tile heights
CARD_Z, CARD_T = 2.3, .12

def build(ink):
    # Faces take ink by orientation: top = light A, +x side = B, +y side = A over B.
    tile = ink('tile', top=(.55, 0), x=(0, 1), y=(1, .75))
    found = ink('found', top=(1, 0), x=(0, 1), y=(1, .75))
    card = ink('card', top=(0, 1), x=(0, .62), y=(0, .38))   # one plate only
    def box(name, x, z, h, mat):
        bpy.ops.mesh.primitive_cube_add(size=1)
        o = bpy.context.object; o.name = name
        o.scale = (SIZE, SIZE, h); o.location = (x + SIZE/2, SIZE/2, z + h/2)
        o.data.materials.append(mat)
    for i in range(5):
        box(f'tile{i}', i*GRID, 0, HIGH if i == 2 else LOW, found if i == 2 else tile)
    box('card', 2*GRID, CARD_Z, CARD_T, card)   # exactly the found tile's footprint
    return (2*GRID + SIZE/2, SIZE/2, 1.0)        # look-at point
