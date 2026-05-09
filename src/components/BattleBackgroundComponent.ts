import type Engine from '../battleBackgrounds/engine';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class BattleBackgroundComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(BattleBackgroundComponent);
  }

  backgroundEngine?: Engine;
  loadingBattlePromise?: Promise<void>;

  constructor(init?: Partial<BattleBackgroundComponent>) {
    super();
    Object.assign(this, init);
  }
}
