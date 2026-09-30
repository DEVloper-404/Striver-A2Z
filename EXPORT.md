# Export guide

Everything is in `dist/`, rebuilt with `python3 build.py`.

## Option 1 — single file (simplest)

`dist/a2z-dsa-sheet.html` (~2.4 MB)

One HTML file with the app, all 474 problems and all 474 solutions inlined. No server,
no folder, no internet. Email it, drop it in Drive, put it on a USB stick, open it in any
browser. This is the one to share.

## Option 2 — the zip

`dist/a2z-dsa-sheet.zip` (~1.6 MB)

The full project: source, per-problem markdown files, build scripts. Unzip and open
`index.html`, or run `npm start`. Use this if you want to edit solutions or the app.

## Moving your progress

Progress (solved, revision stars, notes) is stored per-browser in localStorage, so it does
not travel with the file. To move it: ⋮ menu → **Export progress (JSON)** on the old
machine, then ⋮ → **Import progress** on the new one. This works between the folder
version and the single-file version too.

## Rebuilding after edits

```bash
python3 build.py
```

Regenerates the solution bundle and both artifacts in `dist/`.
