import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export interface GoldCollectibleComponentInit {
  goldId: string;
  amount: number;
  collectionRadius?: number;
}

export class GoldCollectibleComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(GoldCollectibleComponent);
  }

  readonly goldId: string;
  readonly amount: number;
  readonly collectionRadius: number;

  constructor(init: GoldCollectibleComponentInit) {
    super();
    this.goldId = init.goldId;
    this.amount = init.amount;
    this.collectionRadius = init.collectionRadius ?? 1.25;
  }
}
