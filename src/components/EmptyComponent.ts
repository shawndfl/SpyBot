import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

/**
 * This is a template component. It has the mask
 * and a constructor with a partial init argument.
 */
export class EmptyComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(EmptyComponent);
  }

  backgroundEngine: any;

  constructor(init?: Partial<EmptyComponent>) {
    super();
    Object.assign(this, init);
  }
}
