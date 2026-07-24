# ECS component guidance

These instructions apply to `src/components/` and its subdirectories. Follow
the repository-level `AGENTS.md` as well.

## Purpose

Components describe per-entity state in the custom ECS. Put frame-to-frame
orchestration, cross-entity behavior, event handling, and rendering flow in a
system under `src/systems/`.

Components may contain small helpers that operate only on their own state, such
as `show()`, `hide()`, computed getters, or cleanup logic. Do not use a
component to query the `World`, dispatch events, or coordinate other entities.

## Standard component shape

Every ECS component must:

1. Extend `Component` from `src/ecs/Component.ts`.
2. Implement `mask` by calling `ComponentRegistry.getId()` with its own class.
3. Use a `Component` suffix.
4. Provide explicit defaults for state that should always be initialized.

Use this shape for ordinary data components:

```ts
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class ExampleComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(ExampleComponent);
  }

  enabled = true;
  value?: string;

  constructor(init?: Partial<ExampleComponent>) {
    super();
    Object.assign(this, init);
  }
}
```

Adjust relative import paths for components in nested folders.

## Initialization

- Prefer `constructor(init?: Partial<ComponentName>)` and `Object.assign()` for
  simple data components.
- Declare defaults on fields before applying `init`, so callers can override
  them.
- Use a dedicated initialization interface when constructor input differs from
  public runtime state or when assigning fields directly would bypass required
  setup. `TransformComponentInit` is the existing example.
- Do not use `||` when zero, `false`, or an empty string is a meaningful
  supplied value; use `??` or explicit checks.
- Keep required authored data required when an entity cannot operate without
  it. Do not make fields optional solely to make construction convenient.

## Data and ownership

- Prefer serializable authored data where practical.
- References to Three.js, Rapier, DOM, or other runtime objects may live on a
  component when a system creates and owns their lifecycle.
- Clearly distinguish authored/request fields from runtime-populated handles.
- Avoid duplicating state already represented by another component.
- Use enums or string-union types when a field has a closed set of valid
  values.
- Marker components may have no fields when their presence alone is the data.

## Behavior and cleanup

- Keep component methods synchronous and limited to their own fields or owned
  resources.
- Put collision interpretation, input processing, state transitions, entity
  creation, and queries in systems or factories.
- Override `destroy()` when a component owns disposable resources or objects
  attached elsewhere.
- In `destroy()`, detach owned scene objects and dispose owned resources.
- Cleanup must be safe when initialization was only partially completed.

## Registry IDs

`ComponentRegistry` assigns each component class a sequential numeric ID. The
IDs are dictionary keys used to locate each component's store in `World`.

Registration is lazy: using the component class through `mask`, `World`, or a
query registers it automatically. Do not add manual registration unless the
ECS design changes to require it.

## Placement

- Put general components directly in `src/components/`.
- Put rendering mesh data in `src/components/mesh/`.
- Put light data in `src/components/lights/`.
- Put physics bodies, colliders, and sensors in `src/components/physics/`.
- Put particle state in `src/components/particles/`.

Create a new category only when multiple related components justify it.

## Documentation and tests

- Document fields whose units, ownership, lifecycle, or valid combinations are
  not obvious.
- Keep comments aligned with the class's actual purpose.
- Add tests for nontrivial defaults, state helpers, cleanup, or initialization
  rules. Pure marker components generally do not need dedicated tests.
- Run `npm test` and `npm run build` after component code changes.
