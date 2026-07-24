import { Component } from '../src/ecs/Component';
import { ComponentRegistry, type ComponentCtor } from '../src/ecs/ComponentRegistry';

describe('ComponentRegistry', () => {
  it('supports more than 32 component types', () => {
    const componentTypes: ComponentCtor[] = Array.from(
      { length: 40 },
      () =>
        class extends Component {
          get mask(): number {
            return ComponentRegistry.getId(this.constructor as ComponentCtor);
          }
        },
    );

    ComponentRegistry.register(...componentTypes);

    const ids = componentTypes.map((componentType) => ComponentRegistry.getId(componentType));

    expect(new Set(ids).size).toBe(componentTypes.length);
  });
});
