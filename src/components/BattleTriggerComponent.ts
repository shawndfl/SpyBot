import type { TransitionContext } from '../core/TransitionContext';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

/**
 * This will trigger a battle
 */
export class BattleTriggerComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(BattleTriggerComponent);
  }

  context!: TransitionContext;

  constructor(init?: Partial<BattleTriggerComponent>) {
    super();
    Object.assign(this, init);
  }
}
