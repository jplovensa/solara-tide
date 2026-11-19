# Solara Tide · Fjäll villa collection

Three actual furnished SketchUp models in one shared explorer, with the navigation layout used by Shelter of Sky.

| Villa | Direct route | Room viewpoints | Levels | Model size |
| --- | --- | --- | --- | --- |
| One-bedroom | `?villa=one-bedroom` | 5 | Villa | 10.3 MB |
| Two-bedroom | `?villa=two-bedroom` | 9 | Villa | 12.0 MB |
| Family estate | `?villa=estate` | 17 | Ground, Main, Upper | 26.5 MB |

Only the selected villa loads. Changing villas reloads the page so the previous model can be released from graphics memory.

## Realism pass

All villas use physically based materials with fabric sheen, timber clearcoat, honed stone, reflective glass and animated water normals. HDR lighting uses the same Poly Haven environment supplied with Shelter of Sky, with source credit in `assets/realism/credits.json`. The original Fjäll Group logo is used in the header and loading screen. The one-bedroom sofa was rebuilt with a recessed timber base, curved upholstered sections, separate soft seats and loose cushions within its original footprint. The two-bedroom and estate retain their detailed curved furniture.

## Shared interface

Explore opens the collection selector, floor selector, floor-plan map, room shortcuts and links to the other Fjäll series. The bottom controls provide Orbit, Floor plan, Walk through, Tour, Save view and Setting. All models use the same application and CSS.

Settings include daylight, golden hour, dusk, interior lighting, roof visibility, section height, landscape visibility and three performance options. A guided tour visits every listed room. Save view downloads the current 3D frame. Materials and furnishing geometry come from the saved model, including the curved sofas and the estate infinity pool and overhang.

Desktop: drag to look in Walk through; WASD or arrow keys move; Shift moves faster. Orbit: drag to rotate, scroll or pinch to zoom. Phone: left thumb joystick moves; drag the scene to look. Room changes fade between viewpoints.

The estate uses explicit room and level shortcuts between storeys. Automatic stair climbing and gravity are not simulated. Upper-storey movement stays within the model’s floor footprints. Collision geometry is a simplified browser navigation aid, not a construction or regulatory check. Source furniture placement is preserved; this viewer does not modify the native SKP.

## Run locally

Use Node.js 22 or newer and unzip:

```sh
node tools/prepare.mjs
npm run check
npm run dev
```

Open http://127.0.0.1:4178. Playback needs no package install, CDN, API keys or environment variables. Three.js, meshoptimizer and Inter are bundled with their licences.

The three `*-assets.zip` archives contain runtime model files. `tools/prepare.mjs` extracts them for local use and CI. All application source files are editable. The GitHub Pages workflow runs the asset and navigation tests and publishes the static files. The owner authorised public publication of all three web models.

## Source and rights

The one-bedroom, two-bedroom and estate use their respective saved native coastal models, not a generic replacement building. Reports inside `assets/` record the source filename, hash, geometry counts and compressed size. Original villa geometry and material maps are retained, with landscape detail reduced for web playback. The web GLBs are derivatives; editable native SKP files remain outside this repository.

Architecture and scene assets remain the property of their respective rights holders. Repository visibility does not grant a licence to redistribute them. This is an interactive architectural model viewer, not a photorealistic movie renderer.
