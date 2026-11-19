# Solara Tide

[Open the one-bedroom villa walkthrough](https://jplovensa.github.io/solara-tide/)

A standalone interactive experience built from the actual furnished Solara Tide SketchUp model. Architecture by Fjäll Group. This repository is independent of every other villa project.

- Orbit view, first-person walking, six-stop guided tour and room shortcuts.
- Desktop WASD / arrow keys; drag to look. Touch joystick and drag on phones.
- Roof cutaway, landscape toggle, daylight / golden hour and performance settings.
- Original villa geometry and embedded materials, with reduced landscape detail for web playback.

## Run locally

Unzip `runtime-assets.zip` in this directory once, then run `node tools/serve.mjs` and open http://127.0.0.1:4178. No runtime package installation or external CDN is needed. `npm run check` runs asset and navigation checks.

`app.js`, `navigation.mjs`, `index.html` and `style.css` are editable source files. The archive holds `assets/`, `vendor/` and `fonts/`; GitHub Actions extracts these into the Pages deployment. The 10.6 MB GLB is a web derivative, not the editable native SKP. See `assets/model-report.json` for provenance and optimisation details. Source SketchUp files are not included in this public repository.

The walkthrough is a browser model viewer, not a photorealistic rendering or a construction compliance assessment. Furniture, material and architecture rights remain with their respective owners. Three.js and Inter licences are included in the runtime archive.
