# Venue 3D assets

## Floor texture (active)

| File | Purpose |
|------|---------|
| `public/venue-3d/textures/floor-wood.png` | Diffuse map for `VenueWoodFloor` (dark mahogany wood reference) |

Loaded via `@react-three/drei` `useTexture` in `VenueWoodFloor.tsx`. **Single stretch, no tiling:** `FLOOR_TEXTURE_REPEAT` is `[1, 1]` with `ClampToEdgeWrapping` so one image covers the full floor plane (`WORLD_WIDTH` × `WORLD_DEPTH`). If the grain looks soft, use a higher-resolution PNG (e.g. 2048px on the long side, aspect near 24:22).

## Phase 2 GLB

Place compressed GLB files here for production-quality visuals:

| File | Purpose |
|------|---------|
| `venue.glb` | Full room shell (walls, floor, carpet) |
| `stage.glb` | Stage only (optional; replaces `venue-3d/stage/VenueStage`) |
| `table-large.glb` | Large table + chairs |
| `table-medium.glb` | Medium table |
| `table-small.glb` | Small table |
| `chair.glb` | Standalone chair (optional; replaces `VenueBanquetChairMesh`) |

**Active (primitives):** `chair/VenueBanquetChairMesh.tsx` — banquet chair used by `StandaloneChairMesh` and `CatalogTableMesh`.

Load via `@react-three/drei` `useGLTF('/venue-3d/venue.glb')` and swap `VenueRoomPlaceholder` / `CatalogTableMesh` implementations without changing the layout API.

Phase 2 stage: replace `VenueStage` with `StageGltf` inside the same `group` at `STAGE_POSITION` from `stage/stageConstants.ts`.
