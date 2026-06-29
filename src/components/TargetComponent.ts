import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export enum TargetType {
  wayPoint = 'WayPoint',
  enemy = 'Enemy',
  item = 'Item',
  door = 'Door',
}

/**
 * This is the type of target this entity is.
 */
export class TargetComponent extends Component {
  /**
   * Type of target this entity is.
   */
  type?: TargetType;

  get mask(): number {
    return ComponentRegistry.getId(TargetComponent);
  }

  constructor(init?: Partial<TargetComponent>) {
    super();
    Object.assign(this, init);
  }
}
