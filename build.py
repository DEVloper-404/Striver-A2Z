#!/usr/bin/env python3
"""Build exportable packages for the A2Z DSA Sheet clone.

Produces, in dist/:
  a2z-dsa-sheet.html   single self-contained file (CSS + JS + all data inlined)
  a2z-dsa-sheet.zip    the whole folder, ready to share or move
Also refreshes data/solutions.js so the folder works when opened via file://.

Usage:  python3 build.py
"""
import json, os, re, shutil, subprocess, sys, zipfile
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
NAME = 'a2z-dsa-sheet'


def read(*parts):
    with open(os.path.join(ROOT, *parts), encoding='utf-8') as f:
        return f.read()


def bundle_solutions():
    """Regenerate data/solutions.js from solutions/*.md. Returns (have, total, missing)."""
    manifest = json.loads(read('data', 'manifest.json'))
    bundle, missing = {}, []
    for item in manifest:
        path = os.path.join(ROOT, 'solutions', item['id'] + '.md')
        if os.path.exists(path):
            bundle[item['id']] = open(path, encoding='utf-8').read()
        else:
            missing.append(item)
    with open(os.path.join(ROOT, 'data', 'solutions.js'), 'w', encoding='utf-8') as f:
        f.write('window.SOLUTIONS=' + json.dumps(bundle, ensure_ascii=False) + ';\n')
    return len(bundle), len(manifest), missing


def safe(js):
    """Make JS safe to inline inside a <script> tag."""
    return js.replace('</script', '<\\/script')


def build_single_file():
    html = read('index.html')
    css = read('assets', 'style.css')
    scripts = ['data/sheet.js', 'data/solutions.js', 'assets/markdown.js', 'assets/app.js']

    html = html.replace(
        '<link rel="stylesheet" href="assets/style.css">',
        '<style>\n' + css + '\n</style>')

    # drop the external script tags, then append everything inline before </body>
    html = re.sub(r'\n?<script src="data/solutions\.js"[^>]*></script>', '', html)
    for src in scripts:
        html = html.replace('<script src="%s"></script>' % src, '')

    inline = '\n'.join('<script>\n%s\n</script>' % safe(read(*s.split('/'))) for s in scripts)
    html = html.replace('</body>', inline + '\n</body>')
    html = html.replace('<title>', '<!-- Built %s. Single-file build: open directly in any browser. -->\n<title>' % date.today())

    out = os.path.join(DIST, NAME + '.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    return out


SKIP_DIRS = {'dist', '__pycache__', '.git', 'node_modules', '.claude'}
SKIP_FILES = {'.DS_Store'}


def build_zip():
    out = os.path.join(DIST, NAME + '.zip')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for base, dirs, files in os.walk(ROOT):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')]
            for fn in files:
                if fn in SKIP_FILES:
                    continue
                full = os.path.join(base, fn)
                rel = os.path.relpath(full, ROOT)
                z.write(full, os.path.join(NAME, rel))
    return out


def human(n):
    for unit in ('B', 'KB', 'MB'):
        if n < 1024:
            return '%.1f %s' % (n, unit)
        n /= 1024
    return '%.1f GB' % n


def main():
    os.makedirs(DIST, exist_ok=True)
    have, total, missing = bundle_solutions()
    print('solutions bundled: %d / %d' % (have, total))
    if missing:
        print('  missing %d:' % len(missing), ', '.join(m['name'] for m in missing[:8]),
              '…' if len(missing) > 8 else '')

    single = build_single_file()
    print('single file  ->', os.path.relpath(single, ROOT), '(%s)' % human(os.path.getsize(single)))

    archive = build_zip()
    print('zip archive  ->', os.path.relpath(archive, ROOT), '(%s)' % human(os.path.getsize(archive)))

    return 0 if not missing else 1


if __name__ == '__main__':
    sys.exit(main())
