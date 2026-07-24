# SpyHero repository guidance

## Project overview

SpyHero is a browser-based TypeScript game built with Vite. It uses a custom
entity-component-system (ECS), Three.js for rendering, Rapier for physics, and
React for UI overlays.

Read `docs/architecture.md` before making architectural changes. Use
`docs/project-memory.md` for durable decisions, current work, known issues, and
open questions.

## Important directories

- `src/core/`: engine lifecycle, assets, physics context, and game-state flow.
- `src/ecs/`: custom ECS primitives, resources, events, and command buffering.
- `src/components/`: ECS data components.
- `src/systems/`: ECS behavior and rendering systems.
- `src/gameStates/`: loading, overworld, and battle state construction.
- `src/entities/`: entity factory helpers.
- `src/ui/`: React views rendered by UI-oriented systems.
- `src/events/`: game event types.
- `src/input/`: input state, management, and adapters.
- `src/rendering/`, `src/particles/`, `src/battleBackgrounds/`: specialized
  visual subsystems.
- `public/`: runtime models, textures, and other static assets.
- `tests/`: Vitest tests for ECS behavior.

## Development commands

- Install dependencies: `npm install`
- Start the Vite development server: `npm run dev`
- Run tests once: `npm test`
- Run tests in watch mode: `npm run testWatch`
- Type-check and build: `npm run build`
- Preview a production build: `npm run preview`

There is currently no lint script. Do not claim linting passed unless one is
added and run.

## Engineering conventions

- Preserve strict TypeScript settings and the existing ES module style.
- Follow the existing single-quote and semicolon formatting.
- Keep components focused on ECS data and systems focused on behavior.
- Respect system ordering within each game state's `World`; ordering is part of
  runtime behavior.
- Route deferred entity/state changes through `CommandBuffer` where the current
  architecture does so.
- Add or update Vitest coverage when changing testable ECS or engine behavior.
- Avoid editing generated or third-party-derived assets under
  `src/battleBackgrounds/` unless the task specifically concerns them.
- Do not introduce a dependency without explaining why the existing stack is
  insufficient.

## Verification

For normal code changes, run:

1. `npm test`
2. `npm run build`

If browser-only behavior changes, also state what was manually exercised in the
development server. If a check cannot be run, report that clearly.

## Maintaining project memory

- Record stable architecture in `docs/architecture.md`.
- Record meaningful decisions, current focus, known issues, and unresolved
  questions in `docs/project-memory.md`.
- Keep entries factual and dated. Separate confirmed behavior from proposals.
- Update these documents when a change makes them inaccurate; do not use them
  as a chronological dump of every edit.

