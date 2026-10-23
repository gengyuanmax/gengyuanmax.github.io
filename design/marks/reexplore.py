"""ReEXplore project mark, after a Riso gallery poster: one long wall running into
the distance with doorways (the frontiers it explores), an end wall with an
opening, a warm ground at the horizon and a hard shadow at the wall's foot.

Wall faces carry a vertical blend: blue at the top, paper in the middle,
vermilion at the bottom. Door jambs and the wall's top are solid blue.
"""
import bpy

H, T, L = 3.0, .25, 12.0             # wall height, thickness, length
DOORS = [3.4, 5.8, 8.2, 10.6]         # door centres along the wall (equal spacing)
DOOR_W, DOOR_H = 1.0, 2.1

def wall_material(axis='Y'):
    m = bpy.data.materials.new('wall' + axis); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    N = nt.nodes.new; link = nt.links.new
    out = N('ShaderNodeOutputMaterial'); em = N('ShaderNodeEmission')
    geo = N('ShaderNodeNewGeometry'); pos = N('ShaderNodeSeparateXYZ'); nrm = N('ShaderNodeSeparateXYZ')
    link(geo.outputs['Position'], pos.inputs[0]); link(geo.outputs['Normal'], nrm.inputs[0])
    def ramp(src, lo, hi):            # smooth 0..1 between lo and hi
        r = N('ShaderNodeMapRange'); r.interpolation_type = 'SMOOTHSTEP'
        r.inputs['From Min'].default_value, r.inputs['From Max'].default_value = lo, hi
        link(src, r.inputs['Value']); return r.outputs['Result']
    blue = ramp(pos.outputs['Z'], 1.55, 2.95)        # blue grows towards the top
    red = ramp(pos.outputs['Z'], 1.45, 0.0)          # vermilion grows towards the floor
    # Faces whose normal is not along the wall's own axis (jambs, top, ends) print solid blue.
    ay = N('ShaderNodeMath'); ay.operation = 'ABSOLUTE'; link(nrm.outputs[axis], ay.inputs[0])
    face = ramp(ay.outputs[0], .3, .7)              # 1 on the wall faces, 0 on jambs/top
    def mix(fac, a, b_val):
        m_ = N('ShaderNodeMix'); m_.data_type = 'FLOAT'; link(fac, m_.inputs['Factor'])
        m_.inputs['A'].default_value = b_val; link(a, m_.inputs['B']); return m_.outputs['Result']
    dens_a = mix(face, red, 0.0); dens_b = mix(face, blue, 1.0)
    comb = N('ShaderNodeCombineXYZ'); link(dens_a, comb.inputs['X']); link(dens_b, comb.inputs['Y'])
    link(comb.outputs[0], em.inputs['Color']); link(em.outputs[0], out.inputs[0])
    return m

def ground_material():
    m = bpy.data.materials.new('ground'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    N = nt.nodes.new; link = nt.links.new
    out = N('ShaderNodeOutputMaterial'); em = N('ShaderNodeEmission')
    geo = N('ShaderNodeNewGeometry'); pos = N('ShaderNodeSeparateXYZ'); link(geo.outputs['Position'], pos.inputs[0])
    r = N('ShaderNodeMapRange'); r.interpolation_type = 'SMOOTHSTEP'
    r.inputs['From Min'].default_value, r.inputs['From Max'].default_value = 9, 34
    r.inputs['To Min'].default_value, r.inputs['To Max'].default_value = 0, .8   # paper near, a warm band at the horizon
    link(pos.outputs['X'], r.inputs['Value'])
    comb = N('ShaderNodeCombineXYZ'); link(r.outputs['Result'], comb.inputs['X'])
    link(comb.outputs[0], em.inputs['Color']); link(em.outputs[0], out.inputs[0])
    return m

def build(ink):
    wm, em_, gm = wall_material('Y'), wall_material('X'), ground_material()
    def cube(name, loc, scale, mat=None):
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object
        o.name = name; o.scale = scale
        if mat: o.data.materials.append(mat)
        return o
    bpy.ops.mesh.primitive_plane_add(size=1, location=(25, 0, 0)); g = bpy.context.object
    g.name = 'ground'; g.scale = (80, 80, 1); g.data.materials.append(gm)
    wall = cube('wall', (1 + L/2, 0, H/2), (L, T, H), wm)
    end = cube('end', (1 + L - T/2, -2.2, H/2 - .45), (T, 4.4, H - .9), em_)
    cutters = [cube(f'door{i}', (x, 0, DOOR_H/2 - .01), (DOOR_W, 1, DOOR_H)) for i, x in enumerate(DOORS)]
    for c in cutters:
        md = wall.modifiers.new('door', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = c; c.hide_render = True
    hole = cube('opening', (1 + L - T/2, -2.4, .7), (1, 1.5, 1.4)); hole.hide_render = True
    md = end.modifiers.new('opening', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = hole
    return {
        'camera': {'location': (-1.4, -6.4, 1.0), 'look_at': (6.2, 0, 1.4), 'lens': 26, 'shift': (0, .05)},
        'shadow': {'catcher': 'ground', 'sun': (-28, 0, 35), 'ink': (1, 1), 'softness': .3},
    }
