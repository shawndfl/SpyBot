# SpyHero project memory

This file records durable context for future work. Keep confirmed facts,
decisions, and proposals visibly separate.

## Current project status

Last reviewed: 2026-07-24.

- The project is an early-stage browser game built around a custom ECS.
- The implemented high-level states include loading, a small-town overworld,
  and battle.
- The repository has unit tests for `World` and `EntityManager`.
- The root `README.md` is currently empty.
- There is no configured lint command.

## Current focus

### 2026-07-24 — Dialog triggers

The active editor file is `src/components/DialogTriggerComponent.ts`.

Confirmed current behavior:

- `DialogContentComponent` owns the authored title and text for a trigger
  entity.
- `EntityTriggerDispatchSystem` reads dialog content from the non-player entity
  involved in a player collision.
- `NpcFactory` currently attaches the authored dialog content to NPC entities.
- Battle triggers without dialog content transition immediately. If dialog
  content is attached to one in the future, it will transition after dialog
  completion.
- `DialogTriggerComponent` remains an unused marker component.

## Recorded architectural decisions

### 2026-08-10 — Procedural grass terrain material

Decision: Render streamed terrain with the Perlin-noise grass shader instead
of loading a grass texture. Share the material factory with the legacy
`TerrainSystem` and preserve the configured terrain repeat density.

Reason: Terrain grass should be generated procedurally from the authored shader
without depending on a grass texture asset.

Consequence: `ProceduralConfig` no longer contains `grassTexturePath`.
`ProceduralChunkSystem` uses an unlit `ShaderMaterial`; road rendering continues
to use its configured texture.

### 2026-08-07 — Player-oriented overworld camera

Decision: Follow the player with a dedicated `PlayerFollowCameraSystem` using a
behind-and-above offset and frame-rate-independent position smoothing. Orbit
the offset with a frame-rate-independent smoothed player yaw and look ahead in
the direction of that orbit.

Reason: The overworld should keep the character in view while showing the area
in front of the player.

Consequence: `SmallTownState` no longer attaches a `ConstraintComponent` to the
camera. The follow system owns the camera transform outside debug free-camera
mode and runs immediately before `CameraSyncSystem`.

### 2026-07-26 — Procedural terrain MVP

Decision: Generate deterministic terrain in 64-unit chunks. Keep a 3-by-3
chunk area materialized around the player, and expose the generator's canonical
world-space height function through `TerrainHeightResource` for movement and
physics.

Reason: Terrain rendering can follow the player without making mesh state the
source of truth for gameplay height calculations.

Consequence: `SmallTownState` no longer creates a singleton `TerrainComponent`
or runs `TerrainSystem`. Procedural generation remains separate from Three.js
materialization.

### 2026-07-26 — Procedural road MVP

Decision: Generate one deterministic, six-unit-wide east-west road per chunk.
Use canonical boundary seeds so neighboring chunks independently choose the
same shared endpoint, and materialize roads with the streamed terrain. Render
the road with the tiled `rocky_trail_diff_1k.jpg` texture.

Reason: Roads provide the spatial foundation needed by plots, buildings,
navigation, decorations, and NPC placement.

Consequence: `ChunkGenerator` now coordinates terrain and road generation, and
`ProceduralChunkSystem` owns both terrain and road mesh lifecycle.

### 2026-07-26 — Procedural plot MVP

Decision: Generate rectangular plots beside both sides of procedural roads,
reject plots whose rotated corners leave their owning chunk, and visualize
accepted plots with gold Three.js `BoxHelper` outlines.

Reason: Visible plot footprints validate placement and chunk-boundary rules
before building generation begins.

Consequence: `ChunkGenerator` runs `PlotGenerator` after `RoadGenerator`, while
`ProceduralChunkSystem` owns the temporary plot-helper lifecycle.

### 2026-07-24 — Repository memory

Decision: Store durable Codex guidance in the root `AGENTS.md`, stable technical
structure in `docs/architecture.md`, and evolving decisions/context in this
file.

Reason: Project knowledge should be explicit, reviewable, version-controlled,
and available across sessions.

Consequence: Meaningful architecture or workflow changes should update the
relevant document as part of the same change.

## Known issues and risks

- Automated coverage currently focuses on foundational ECS behavior; rendering,
  physics, UI, and state-transition behavior have little or no visible test
  coverage.
- `DialogTriggerComponent`'s comment and its apparent role are inconsistent.
- Because system execution order is manually constructed inside game states,
  inserting or reordering a system can change behavior.

## Open product and design questions

- What is the intended player experience and core gameplay loop for SpyHero?
- What is the intended distinction between NPC dialog, generic dialog
  triggers, and battle triggers?
- Should dialog content live directly on ECS components, in authored data, or
  behind identifiers resolved by another service?
- Which browser and device targets must the game support?
- What level of automated coverage is expected for rendering and physics
  behavior?
