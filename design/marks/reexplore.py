"""ReEXplore project mark: a wall with an arched doorway on a floor slab,
and the next frontier (a short post) seen through it."""
import bpy, math

def build(ink):
    floor = ink('floor', top=(.55, 0), x=(0, 1), y=(1, .75))
    wall = ink('wall', top=(.55, 0), x=(0, 1), y=(1, .75))
    post = ink('post', top=(1, 0), x=(0, 1), y=(1, .75))
    def cube(name, loc, scale, mat=None):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object
        o.name = name; o.scale = scale
        if mat: o.data.materials.append(mat)
        return o
    cube('floor', (2, 2, -.1), (4, 4, .2), floor)
    w = cube('wall', (2, 2, 1.2), (3, .35, 2.4), wall)
    # Doorway: a box plus a half-cylinder top, cut out with a boolean modifier.
    door = cube('door', (2, 2, .6), (1, 1, 1.2))
    bpy.ops.mesh.primitive_cylinder_add(radius=.5, depth=1, vertices=64, location=(2, 2, 1.2), rotation=(math.pi/2, 0, 0))
    arch = bpy.context.object
    for cutter in (door, arch):
        m = w.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = cutter; cutter.hide_render = True
    bpy.ops.mesh.primitive_cylinder_add(radius=.22, depth=.7, vertices=64, location=(1.72, 1.62, .35))
    p = bpy.context.object; p.data.materials.append(post)
    return (2, 2, 1)
