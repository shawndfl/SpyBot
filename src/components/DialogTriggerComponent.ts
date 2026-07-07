import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

/**
 * This will trigger a battle
 */
export class DialogTriggerComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(DialogTriggerComponent);
  }

  constructor(init?: Partial<DialogTriggerComponent>) {
    super();
    Object.assign(this, init);
  }
}
