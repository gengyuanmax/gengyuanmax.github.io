"""Render a mark scene with Blender (bpy) into ink-density plates.

python3 design/marks/render.py icq  ->  src/design/assets/mark-icq.ts
(plates and raw renders also in design/marks/out/ for review; 360x220 source at 2x)

Inks: a = vermilion, b = blue, c = yellow, d = dark. A scene's materials emit
ink densities as colour; three inks fit in one render (R, G, B), so a scene
using the dark ink is rendered twice. Blender handles projection, occlusion and
anti-aliasing; the site's print pipeline does all printing afterwards.

Scene modules define build(ink, emit) and may return:
  (x, y, z)                              isometric orthographic camera aimed there, or
  {'camera': {...}, 'shadow': {...}}     a perspective camera and a cast-shadow pass.
ink(label, top=, x=, y=) takes per-face densities as dicts like {'a': .55} (or (a, b) tuples).
emit(nt, {'a': socket_or_float, ...}) wires densities into an emission output.
"""
import sys, importlib.util, pathlib, math
import bpy, numpy as np
from PIL import Image
from mathutils import Vector
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from plates import write

name = sys.argv[1]
here = pathlib.Path(__file__).parent
spec_ = importlib.util.spec_from_file_location(name, here / f'{name}.py'); scene_mod = importlib.util.module_from_spec(spec_); spec_.loader.exec_module(scene_mod)
W, H = 720, 440
INKS = 'abcd'
channels = ('a', 'b', 'c')   # which inks the current pass writes into R, G, B

def as_dens(v):
    return dict(zip('ab', v)) if isinstance(v, (tuple, list)) else dict(v)

def emit(nt, dens):
    """Route the current pass's three inks into an emission colour."""
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    comb = nt.nodes.new('ShaderNodeCombineXYZ')
    for axis, ink in zip('XYZ', channels):
        v = dens.get(ink, 0)
        if isinstance(v, (int, float)): comb.inputs[axis].default_value = v
        else: nt.links.new(v, comb.inputs[axis])
    nt.links.new(comb.outputs[0], em.inputs['Color']); nt.links.new(em.outputs[0], out.inputs[0])

def ink(label, top, x, y):
    """Per-face densities chosen by world normal: top (+z), +x side, +y side."""
    m = bpy.data.materials.new(label); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(geo.outputs['Normal'], sep.inputs[0])
    faces = [(sep.outputs['Z'], as_dens(top)), (sep.outputs['X'], as_dens(x)), (sep.outputs['Y'], as_dens(y))]
    dens = {}
    for k in INKS:
        total = None
        for axis, d in faces:
            if not d.get(k): continue
            mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'; mx.inputs[1].default_value = 0; nt.links.new(axis, mx.inputs[0])
            mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = d[k]; nt.links.new(mx.outputs[0], mul.inputs[0])
            if total is None: total = mul.outputs[0]
            else:
                add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'; nt.links.new(total, add.inputs[0]); nt.links.new(mul.outputs[0], add.inputs[1]); total = add.outputs[0]
        if total is not None: dens[k] = total
    emit(nt, dens)
    return m

def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    built = scene_mod.build(ink, emit) if scene_mod.build.__code__.co_argcount > 1 else scene_mod.build(ink)
    spec = built if isinstance(built, dict) else {'target': built}
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    sc.render.resolution_x, sc.render.resolution_y = W, H
    if 'camera' in spec:   # scene-authored perspective camera
        c = spec['camera']; cam.data.type = 'PERSP'; cam.data.lens = c.get('lens', 35)
        cam.location = c['location']
        cam.rotation_euler = (Vector(c['look_at']) - Vector(c['location'])).to_track_quat('-Z', 'Y').to_euler()
        cam.data.shift_x, cam.data.shift_y = c.get('shift', (0, 0))
    else:                  # isometric orthographic camera, auto-framed with a fixed margin
        target = spec['target']; cam.data.type = 'ORTHO'
        cam.rotation_euler = (math.radians(54.7356), 0, math.radians(135))
        d = 30; cam.location = (target[0] + d*.57735, target[1] + d*.57735, target[2] + d*.57735)
        bpy.context.view_layer.update()
        inv = cam.matrix_world.inverted()
        pts = [inv @ (o.matrix_world @ Vector(c)) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
        xs, ys = [p.x for p in pts], [p.y for p in pts]
        w, h = (max(xs)-min(xs))*1.1, (max(ys)-min(ys))*1.1
        cam.data.ortho_scale = max(w, h*W/H)
        cam.data.shift_x = (max(xs)+min(xs))/2/cam.data.ortho_scale
        cam.data.shift_y = (max(ys)+min(ys))/2/cam.data.ortho_scale
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 64
    sc.view_settings.view_transform = 'Standard'; sc.render.film_transparent = True
    sc.world = bpy.data.worlds.new('w'); sc.render.image_settings.color_mode = 'RGBA'
    sc.render.dither_intensity = 0   # dither would leave faint ink in unused channels
    return sc, spec

def render(sc, path):
    sc.render.filepath = str(path); bpy.ops.render.render(write_still=True)
    return np.asarray(Image.open(path).convert('RGBA')).astype(np.float32) / 255

(here / 'out').mkdir(exist_ok=True)
plates = {}
passes = [('a', 'b', 'c'), ('d', None, None)]
for i, chans in enumerate(passes):
    channels = chans
    sc, spec = setup()
    if i and not getattr(scene_mod, 'USES_DARK', False): break
    rgba = render(sc, here / 'out' / f'{name}-render{"" if i == 0 else "-d"}.png')
    for ch, k in enumerate(chans):
        if k: plates[k] = np.clip(rgba[..., ch] * rgba[..., 3], 0, 1)   # straight colour × coverage

if 'shadow' in spec:
    # Extra pass: the floor becomes a shadow catcher lit by a sun, everything else a
    # holdout, so this render's alpha is exactly the cast shadow.
    sh = spec['shadow']; plain = bpy.data.materials.new('plain')
    for o in sc.objects:
        if o.type == 'MESH':
            o.data.materials.clear(); o.data.materials.append(plain)
            o.is_holdout = o.name != sh['catcher']; o.is_shadow_catcher = o.name == sh['catcher']
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.data.angle = math.radians(sh.get('softness', .5)); sun.rotation_euler = [math.radians(v) for v in sh['sun']]
    shadow = render(sc, here / 'out' / f'{name}-shadow.png')[..., 3]
    for k, amount in sh['ink'].items():
        plates[k] = np.maximum(plates.get(k, 0), shadow * amount)

if 'fade_edges' in spec:
    # Layers that run off the artboard (ground, horizon) fade out at its left and right
    # edges, so the frame's edge never shows as a hard cut when the page box is wider
    # than 360:220 and the art is letterboxed inside it.
    xs = np.linspace(0, 1, W, dtype=np.float32)
    for k, width in spec['fade_edges'].items():
        t = np.clip(np.minimum(xs, 1 - xs) / width, 0, 1); ramp = t * t * (3 - 2 * t)
        if k in plates: plates[k] = plates[k] * ramp[None, :]

write(name, {k: plates[k] for k in INKS if k in plates and plates[k].max() > .05}, f'design/marks/render.py {name}')
