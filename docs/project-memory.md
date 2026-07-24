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

- `DialogTriggerComponent` is an empty ECS marker component.
- Its comment currently says it triggers a battle, but the component is named
  for dialogs.
- `EntityTriggerDispatchSystem` currently handles collision-driven dialog and
  battle behavior directly.
- `DialogTriggerComponent` is not currently imported or queried by that
  system.

No intended redesign has been recorded yet. Before changing this area, clarify
whether dialog triggers should carry dialog content, identify a conversation,
or remain marker-only.

## Recorded architectural decisions

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

