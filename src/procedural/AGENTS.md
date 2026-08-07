# Procedural generation guidance

These instructions apply to `src/procedural/` and its subdirectories. Follow
the repository-level `AGENTS.md` as well.

## Purpose

This package generates deterministic world chunks through an ordered pipeline:

```text
ChunkGenerator
    -> TerrainGenerator
    -> RoadGenerator
    -> PlotGenerator
    -> BuildingGenerator
    -> DecorationGenerator
    -> CollisionGenerator
    -> NavMeshGenerator
    -> NPCSpawner
```

Treat these classes as generation stages, not frame-updated ECS `System`
subclasses. Generation should produce plain chunk descriptions. A separate
materialization layer turns those descriptions into ECS entities, Three.js
objects, and Rapier resources.

## Proposed package structure

```text
src/procedural/
|-- AGENTS.md
|-- ChunkGenerator.ts
|-- GenerationContext.ts
|-- GenerationTypes.ts
|-- random/
|   `-- SeededRandom.ts
`-- generators/
    |-- TerrainGenerator.ts
    |-- RoadGenerator.ts
    |-- PlotGenerator.ts
    |-- BuildingGenerator.ts
    |-- DecorationGenerator.ts
    |-- CollisionGenerator.ts
    |-- NavMeshGenerator.ts
    `-- NPCSpawner.ts
```

Add folders for materialization or streaming only when those features are
implemented rather than placing unrelated responsibilities in a generator.

## Pipeline contract

`ChunkGenerator` is the coordinator. It creates an empty `ChunkData`, invokes
each stage in a fixed order, validates the result, and returns it. Individual
stages must not invoke later stages directly.

Prefer a shared contract:

```ts
export interface ProceduralGenerator {
  generate(context: ChunkGenerationContext, chunk: ChunkData): void;
}
```

The context should contain generation inputs and services, not generated world
state:

```ts
export interface ChunkGenerationContext {
  seed: number;
  chunkX: number;
  chunkZ: number;
  chunkSize: number;
  random: SeededRandom;
}
```

`ChunkData` should contain the accumulated output:

```ts
export interface ChunkData {
  terrain: TerrainData;
  roads: RoadData[];
  plots: PlotData[];
  buildings: BuildingData[];
  decorations: DecorationData[];
  collisions: CollisionData[];
  navigation: NavigationData;
  npcSpawns: NPCSpawnData[];
}
```

These shapes are a starting contract. Evolve them as implementation reveals
real requirements, and update this file when the architecture changes.

## Determinism

- The same world seed, chunk coordinates, configuration, and asset catalog must
  produce the same `ChunkData`.
- Never use `Math.random()` in procedural generation.
- Derive randomness from the world seed, chunk coordinates, and a stable
  generator-specific salt.
- Give each stage an independent random stream, such as `random.fork('roads')`,
  so changes in decoration sampling do not alter terrain, roads, or buildings.
- Do not make output depend on object iteration order, wall-clock time, frame
  rate, or asynchronous completion order.
- Add regression tests for determinism and differing seeds.

## Pure data and ECS materialization

Generators should produce authored descriptions rather than mutate `World`.
Do not create ECS entities, Three.js meshes, Rapier bodies, React roots, or DOM
elements inside generation stages.

For example, `BuildingGenerator` should return building footprints and model
choices rather than create `MeshGlbComponent` instances. `CollisionGenerator`
should produce collider descriptions rather than Rapier colliders.
`NPCSpawner` should produce `NPCSpawnData`; a materializer may later call
`NpcFactory.addNpc()`.

Use a separate materialization boundary:

```text
generation inputs -> ChunkData -> ECS/Three.js/Rapier materialization
```

This separation keeps generation testable without a browser or initialized
physics engine and allows chunks to be serialized, regenerated, or streamed.

## Coordinates and chunk boundaries

- Use `64` world units as the default chunk side length, producing a
  `64 x 64` world-unit footprint. Define it once in shared procedural
  configuration and derive generator calculations from it rather than
  hardcoding `64` throughout the pipeline.
- Store chunk identity as integer `(chunkX, chunkZ)` coordinates.
- Define one canonical conversion between chunk-local and world coordinates.
- State clearly whether bounds are inclusive or exclusive.
- Sample terrain functions in world coordinates so adjacent terrain edges
  agree.
- Derive shared road entrances from stable boundary keys so independently
  generated neighboring chunks connect.
- Avoid embedding floating-point positions in chunk identity keys.
- Test negative coordinates and all four neighboring boundaries.

## Stage responsibilities

### `ChunkGenerator`

- Owns pipeline order and orchestration.
- Creates stage-specific random streams.
- Validates stage prerequisites and final invariants.
- Returns chunk data without rendering or adding entities.

### `TerrainGenerator`

- Produces the height field and terrain surface description.
- Supports deterministic height sampling in world coordinates.
- Guarantees matching height samples at neighboring chunk boundaries.
- Does not create a Three.js mesh.

`TerrainGenerator` is the canonical source of terrain samples. The overworld
registers `TerrainHeightResource` so movement and physics use the same height
function, while `ProceduralChunkSystem` materializes and streams terrain and
road meshes around the player. The legacy `TerrainSystem` and
`TerrainComponent` are not part of the active overworld path.

### `RoadGenerator`

- Produces road centerlines, widths, intersections, and boundary connections.
- Connects important locations without crossing invalid terrain.
- Coordinates entrances with neighboring chunks deterministically.
- Leaves enough metadata for plots, decorations, collision, and navigation.

The MVP generates one six-unit-wide east-west road per chunk. Shared boundary
keys make neighboring chunks agree on endpoints, while a seeded midpoint gives
each road a gentle curve. Road meshes currently follow sampled terrain heights
without flattening the underlying terrain.

### `PlotGenerator`

- Divides road-adjacent space into buildable parcels.
- Records plot bounds, frontage, orientation, and intended use.
- Rejects excessive slope and intersections with roads or reserved areas.
- Does not select or instantiate render assets.

The MVP places up to three rectangular plots on each side of every road. Plots
that would leave their owning chunk are rejected. `ProceduralChunkSystem`
visualizes accepted plot footprints with gold Three.js `BoxHelper` outlines;
the helpers are temporary development visualization, not generated plot data.

### `BuildingGenerator`

- Selects valid buildings for plots.
- Produces footprint, transform, dimensions, entrance, floors, and asset ID.
- Keeps entrances accessible from roads and navigation space.
- Does not create meshes, colliders, or ECS entities.

### `DecorationGenerator`

- Places trees, lamps, signs, fences, and environmental props.
- Avoids roads, buildings, entrances, colliders, and reserved navigation space.
- Produces descriptions that a materializer can map to `PropFactory` or ECS
  components.

### `CollisionGenerator`

- Derives static collider descriptions from terrain, buildings, and props.
- Uses simple shapes and merges adjacent volumes when practical.
- Records ownership so colliders can be removed when a chunk unloads.
- Does not create Rapier objects directly.

### `NavMeshGenerator`

- Initially produce a navigation grid or waypoint graph because the project
  does not currently include a navmesh library.
- Exclude buildings, collisions, steep terrain, and other blocked regions.
- Connect compatible navigation edges at chunk boundaries.
- Keep the data contract replaceable by a polygonal navmesh later.

### `NPCSpawner`

- Chooses valid positions from navigation data after geometry and collision
  generation are complete.
- Produces spawn descriptions containing role, transform, model, dialog,
  schedule, patrol, or other authored metadata.
- Does not call `NpcFactory` or modify `World` directly.

## Chunk ownership and lifecycle

When materialization is introduced, track everything created for a chunk:

```ts
export interface LoadedChunk {
  key: string;
  data: ChunkData;
  entityIds: number[];
}
```

Chunk ownership must support loading once, unloading all owned entities and
resources, and regenerating the same data from its seed. Do not leave Three.js
objects, Rapier resources, or ECS entities behind after unloading.

## Validation

Validate data at stage boundaries and fail with errors that identify the seed,
chunk coordinates, stage, and violated invariant. Useful invariants include:

- terrain dimensions and sample counts are consistent;
- all positions are finite;
- roads remain inside the chunk except at declared boundary connections;
- plots do not overlap roads or each other;
- buildings remain inside their plots;
- decorations do not occupy reserved space;
- navigation nodes do not lie inside generated collisions;
- NPC spawn positions are navigable.

## Testing

Keep most procedural tests independent of Three.js rendering, Rapier, and the
DOM. At minimum, cover:

- identical inputs produce deeply equal output;
- different seeds produce meaningfully different output;
- negative chunk coordinates work;
- terrain and road boundaries match neighboring chunks;
- stage invariants hold across a representative seed set;
- empty or sparse chunks remain valid;
- materialization and unloading do not leak owned entities or resources once
  those layers exist.

Prefer compact property-style loops over large committed snapshots. If a
generation failure is found, retain its seed and chunk coordinates as a
regression case.

## Implementation order

Build the subsystem incrementally:

1. Define generation context, output types, seeded random streams, and the
   `ChunkGenerator` coordinator.
2. Generate one deterministic terrain chunk with world-coordinate height
   sampling and matching neighbor edges.
3. Add one road crossing the chunk and debug visualization for its path.
4. Generate and visualize road-adjacent plots.
5. Add building and decoration descriptions, then materialize them into ECS
   entities.
6. Generate collision descriptions and materialize them through the existing
   physics components.
7. Add a navigation graph and NPC spawn descriptions.
8. Add chunk loading, ownership, unloading, and generation budgets.

The first end-to-end milestone is one deterministic chunk containing terrain,
one connected road, and debug-visible plots. Do not begin buildings, physics,
navigation, or NPC spawning until coordinates, determinism, boundary behavior,
and the data/materialization split are verified.
