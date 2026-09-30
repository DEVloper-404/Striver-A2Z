#!/usr/bin/env python3
"""Bundle solutions/*.md into data/solutions.js so the site works when opened
directly as a file (file://) without a web server. Re-run after editing any
solution file:  python3 build_solutions.py
"""
import json, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SOL = os.path.join(ROOT, 'solutions')
OUT = os.path.join(ROOT, 'data', 'solutions.js')

manifest = json.load(open(os.path.join(ROOT, 'data', 'manifest.json')))
ids = [m['id'] for m in manifest]
bundle, missing = {}, []
for pid in ids:
    path = os.path.join(SOL, pid + '.md')
    if os.path.exists(path):
        bundle[pid] = open(path, encoding='utf-8').read()
    else:
        missing.append(pid)

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('window.SOLUTIONS=' + json.dumps(bundle, ensure_ascii=False) + ';\n')

print(f'bundled {len(bundle)}/{len(ids)} solutions -> {os.path.relpath(OUT, ROOT)}')
if missing:
    names = {m['id']: m['name'] for m in manifest}
    print('missing:', ', '.join(f'{i} ({names[i]})' for i in missing))
    sys.exit(1)
