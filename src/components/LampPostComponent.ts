import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class LampPostComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(LampPostComponent);
  }

  constructor(init?: Partial<LampPostComponent>) {
    super();
    Object.assign(this, init);
  }
}
