# SpyHero architecture

Last verified against the repository: 2026-07-24.

## Runtime stack

- TypeScript 5.9 with strict checking
- Vite 8
- Three.js for WebGL rendering and scene objects
- Rapier 3D compatibility build for physics
- React 19 and React DOM for UI overlays
- Sass for UI styling
- Vitest for tests

## Application lifecycle

`src/main.ts` creates one `Engine`, initializes it, and starts its animation
loop. The engine owns shared renderer, physics, and asset-manager instances.

The engine begins in `LoadingState`, which loads the initial asset manifest and
then changes to `SmallTownState`. Each game state owns its own `World`.
`GameStateManager` manages states as a stack and supports `push`, `pop`, and
`change` transitions.

The engine uses a fixed update step of 1/60 second. During an update it:

1. Clears the shared event bus.
2. Builds an `UpdateEvent`.
3. Updates the active game state and its world systems.
4. Consumes a requested state transition.
5. Flushes deferred commands.

## Entity-component-system

The custom ECS lives in `src/ecs/`.

- `World` owns entities, components, resources, and an ordered system list.
- Components are registered by constructor and stored in component-centric
  maps keyed by registry IDs.
- `World.query()` and `World.queryWithEntity()` find entities that have all
  requested component types.
- Systems receive the active world, delta time, event bus, and command buffer
  through `UpdateEvent`.
- `EventBus` carries frame-scoped events between systems.
- `CommandBuffer` defers state transitions and other mutations until the
  appropriate point in the engine update.

System order is significant. For example, `SmallTownState` creates input and
terrain early, runs movement before physics, dispatches physics trigger events
after physics, and renders after scene-oriented update systems.

## Game states

- `LoadingState`: loads assets and initializes physics before entering the next
  requested state.
- `SmallTownState`: constructs the overworld ECS world, including the player,
  camera, terrain, NPC, lamps, enemy spawn, dialog state, and related systems.
- `BattleState`: constructs and runs the battle experience.
- `EmptyGameState`: null-object fallback when no state is active.

Pushing a state exits the current state but keeps it on the stack. Popping
exits the top state and re-enters the state beneath it. Changing replaces the
top state.

## Rendering and physics

Three.js scenes are owned by game states. Mesh and light components describe
renderable data, while initialization and rendering systems connect ECS state
to Three.js objects.

Rapier integration is exposed through `PhysicsContext` and `PhysicsSystem`.
Rigid bodies, colliders, and collider sensors are ECS components. Physics
trigger events become `EntityTriggerEvent` instances that later systems can
interpret as gameplay actions.

The overworld is generated in deterministic 64-unit chunks coordinated by
`ChunkGenerator`. `TerrainGenerator` creates height data and `RoadGenerator`
creates a continuous east-west road through each chunk. `PlotGenerator` places
rectangular building plots beside roads and rejects plots outside their owning
chunk. `GoldGenerator` creates deterministic, terrain-aligned gold deposit data
for each chunk. `ProceduralChunkSystem` visualizes deposits with small additive
gold particle emitters and keeps a 3-by-3 set of terrain, road meshes, emitters,
and gold `BoxHelper` plot outlines loaded around the player, unloading them
outside that radius. Terrain uses the procedural Perlin-noise grass shader shared with
the legacy `TerrainSystem`, while roads retain their tiled texture. Movement
and physics obtain the same world-space height function through
`TerrainHeightResource`; the legacy `TerrainSystem` is no longer used by
`SmallTownState`.

Collected gold is stored as a deterministic-world delta. `GoldCollectionSystem`
adds nearby deposit IDs and amounts to `PlayerProgressResource`, which persists
immediately through `LocalSaveStore`. Chunk materialization filters those IDs,
so regenerated chunks retain their procedural layout without respawning
collected deposits.

## Input and UI

`InputSystem` publishes frame input through `GameInputEvent` and resets
edge-triggered inputs after the state's systems update.

In the overworld, `PlayerFollowCameraSystem` rotates a behind-and-above offset
with a smoothed version of the player's yaw and translates the camera toward it
using independent frame-rate-independent orbit and position smoothing. The
camera looks ahead in the direction of the smoothed orbit. `CameraSyncSystem`
applies the resulting transform to the Three.js camera. The follow system
yields camera ownership while debug free-camera mode is active.

React is used as an overlay rather than as the owner of the game loop.
UI-oriented ECS systems create DOM containers and React roots, then render
views from `src/ui/`. Current examples include dialog, battle-menu, and debug
HUD views.

## Audio

WAV files under `public/` are listed by stable IDs in `SoundManifest` and
decoded through the loading state's existing `AssetManager` sound pipeline.
Gameplay systems emit frame-scoped `PlaySoundEvent` instances; `AudioSystem`
forwards them to the shared `AudioManager`, which owns Web Audio playback,
effects/UI/music gain buses, per-sound concurrency limits, and first-input
audio-context unlocking. Playback requests can optionally add a bounded
delay/feedback echo with a dry/wet mix. Gold collection currently emits
`goldCollect` with a subtle echo.

## Current dialog flow

`SmallTownState` creates a singleton-like entity with `DialogComponent` and
adds `DialogSystem` near the end of its system order.

`EntityTriggerDispatchSystem` consumes collision events. When the player enters
a trigger whose entity has `DialogContentComponent`, it copies that component's
authored title and text into `DialogComponent`. For battle triggers, completing
that dialog requests a pushed `BattleState`. Battle triggers without dialog
content transition immediately.

`DialogSystem` progressively reveals text and renders `DialogView`. Select or
attack input, as well as the view callback, first completes text revelation and
then closes a fully revealed dialog and invokes its completion callback.

`DialogTriggerComponent` exists but is currently an empty marker component and
is not part of the observed dispatch path. Dialog dispatch currently keys
directly off the presence of `DialogContentComponent`.
