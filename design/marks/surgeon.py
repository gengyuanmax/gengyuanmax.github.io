"""How to Train a Surgeon? project mark: the operating field as a low disc,
tissue at its centre, two instruments descending onto it symmetrically."""
import bpy, math
from mathutils import Vector

def build(ink):
    field = ink('field', top=(.55, 0), x=(0, 1), y=(1, .75))
    tissue = ink('tissue', top=(1, 0), x=(0, 1), y=(1, .75))
    tool = ink('tool', top=(0, 1), x=(0, .62), y=(0, .38))
    bpy.ops.mesh.primitive_cylinder_add(radius=2, depth=.4, vertices=128, location=(0, 0, .2))
    bpy.context.object.data.materials.append(field)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, .65)); t = bpy.context.object
    t.scale = (.9, .9, .5); t.data.materials.append(tissue)
    tip = Vector((0, 0, 1.1))
    # Mirror-symmetric about the x = y plane, which is the camera's vertical axis.
    for start in (Vector((-3.4, .0, 3.4)), Vector((.0, -3.4, 3.4))):
        d = tip - start
        bpy.ops.mesh.primitive_cube_add(size=1, location=(start + tip) / 2); r = bpy.context.object
        r.scale = (d.length, .34, .34)
        r.rotation_mode = 'QUATERNION'; r.rotation_quaternion = Vector((1, 0, 0)).rotation_difference(d)
        r.data.materials.append(tool)
    return (0, 0, 1)
