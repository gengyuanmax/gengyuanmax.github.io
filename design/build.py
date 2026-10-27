"""Regenerate every design-tool output and record design/outputs.json.

    npm run design            # all
    npm run design -- marks   # only the project marks
    npm run design -- landscape

outputs.json records, per generator, the sha256 of its inputs (the scripts it runs, the
shared helpers, its source images and the config/palette it reads) and of its outputs.
tests/design-outputs.test.mjs recomputes both, so CI fails when a generator, a source or a
committed output changes without the others being regenerated.
"""
import hashlib, json, pathlib, subprocess, sys

root = pathlib.Path(__file__).resolve().parents[1]
GENERATORS = {
    'mark-icq': {
        'group': 'marks', 'run': ['design/marks/render.py', 'icq'],
        'inputs': ['design/marks/render.py', 'design/marks/plates.py', 'design/marks/icq.py'],
        'outputs': ['src/design/assets/mark-icq.ts'],
    },
    'mark-reexplore': {
        'group': 'marks', 'run': ['design/marks/render.py', 'reexplore'],
        'inputs': ['design/marks/render.py', 'design/marks/plates.py', 'design/marks/reexplore.py'],
        'outputs': ['src/design/assets/mark-reexplore.ts'],
    },
    'mark-surgeon': {
        'group': 'marks', 'run': ['design/marks/surgeon_scan.py'],
        'inputs': ['design/marks/surgeon_scan.py', 'design/marks/plates.py', 'design/marks/sources/gliax-instruments-scan-1.jpg'],
        'outputs': ['src/design/assets/mark-surgeon.ts'],
    },
    'mark-meretriever': {
        'group': 'marks', 'run': ['design/marks/meretriever.py'],
        'inputs': ['design/marks/meretriever.py', 'design/marks/plates.py'],
        'outputs': ['src/design/assets/mark-meretriever.ts'],
    },
    'home-landscape': {
        'group': 'landscape', 'run': ['design/photo/home_landscape_4c.py'],
        'inputs': ['design/photo/home_landscape_4c.py', 'src/config/home-landscape.ts', 'src/config/design.json',
                   'src/design/settings.ts', 'src/assets/home/mountain.jpg', 'public/images/portrait-source-cutout.png'],
        'outputs': [f'src/assets/home/landscape-4c/{p}{i}.png' for p in ('', 'figure-') for i in 'abcd'],
    },
}

def sha(path):
    return hashlib.sha256((root / path).read_bytes()).hexdigest()

def main():
    groups = set(sys.argv[1:]) or {'marks', 'landscape'}
    manifest_path = root / 'design' / 'outputs.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    for name, g in GENERATORS.items():
        if g['group'] not in groups: continue
        print(f'· {name}', flush=True)
        subprocess.run([sys.executable, *g['run']], cwd=root, check=True, stdout=subprocess.DEVNULL)
        manifest[name] = {'inputs': {p: sha(p) for p in g['inputs']}, 'outputs': {p: sha(p) for p in g['outputs']}}
    manifest_path.write_text(json.dumps(manifest, indent=1, sort_keys=True) + '\n')
    print('wrote design/outputs.json')

if __name__ == '__main__':
    main()
