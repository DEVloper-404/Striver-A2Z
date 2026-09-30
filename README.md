# Striver's A2Z DSA Sheet — Local Clone

A self-contained, offline clone of the A2Z DSA sheet layout: 18 steps, 62 sub-steps, 474 problems, with progress tracking and an original solution write-up for every problem.

## Run it

Three ways, no dependencies beyond Python 3 (only used for the tiny server and the build script):

1. **Single file** — open `dist/a2z-dsa-sheet.html` in any browser. Everything is inlined; no server, no folder, works offline and copies around as one file.
2. **The folder** — open `index.html` directly (`file://` works, solutions are pre-bundled).
3. **Local server** — `npm start` or `python3 -m http.server 8080`, then visit http://localhost:8080.

## Export / package

```bash
python3 build.py     # or: npm run build
```

That regenerates `data/solutions.js` and writes two artifacts to `dist/`:

| File | What it is |
| --- | --- |
| `a2z-dsa-sheet.html` | one self-contained page, ~2 MB, opens anywhere |
| `a2z-dsa-sheet.zip` | the whole project, ready to move or share |

Progress lives in the browser's `localStorage`, so it does not travel inside the package. Use the ⋮ menu to export progress as JSON and import it on another machine or into the single-file build.

## Features

- Step → sub-step → problem accordion with per-level progress bars and counts
- Overall progress ring with Easy / Medium / Hard breakdown
- Solved checkboxes, revision stars, per-problem notes (all saved in `localStorage`)
- Tabs: All Problems / Revision
- Search, status filter (solved / unsolved), difficulty filter, Random Problem
- Solution viewer with C++ / Java / Python tabs, copy buttons, prev/next navigation
- Links per problem: article, video, practice (LeetCode / GFG / Coding Ninjas as on the sheet)
- Stats view, streak counter, dark/light theme, export/import progress JSON
- Keyboard: `/` search, `r` random, `Esc` close, `←`/`→` in the solution viewer
- Deep link to a solution: `index.html#p=<problem_id>`

## Layout

```
index.html            app shell
assets/               style.css, app.js, markdown.js (tiny MD renderer)
data/sheet.json       sheet structure (steps / sub-steps / problems / links)
data/sheet.js         same data as a script (for file:// use)
data/solutions.js     all solutions bundled (generated)
data/manifest.json    flat problem list
solutions/<id>.md     one markdown solution per problem
build_solutions.py    regenerates data/solutions.js from solutions/
build.py              builds dist/ (single-file HTML + zip)
package.json          npm start / npm run build
dist/                 exportable artifacts (generated)
SOLUTION_GUIDE.md     template used for the write-ups
```

After editing anything in `solutions/`, run:

```bash
python3 build_solutions.py
```

## Notes

Problem names, ordering, difficulty and outbound links mirror the public sheet. The solution text and code are original write-ups, not copies of the site's editorials.
