import { ComponentRegistry } from '../../ecs/ComponentRegistry';
import { ColliderComponent } from './ColliderComponent';

export type ColliderShape = 'box' | 'sphere' | 'capsule';

export class ColliderSensorComponent extends ColliderComponent {
  get mask(): number {
    return ComponentRegistry.getId(ColliderSensorComponent);
  }

  get isSensor(): boolean {
    return true;
  }

  constructor(init?: Partial<ColliderSensorComponent>) {
    super();
    Object.assign(this, init);
  }
}
