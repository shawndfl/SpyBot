import type RAPIER from '@dimforge/rapier3d-compat';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

export type RigidBodyType = 'dynamic' | 'fixed' | 'kinematic';

export class RigidBodyComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(RigidBodyComponent);
  }

  type: RigidBodyType = 'dynamic';
  body?: RAPIER.RigidBody;

  constructor(init?: Partial<RigidBodyComponent>) {
    super();
    Object.assign(this, init);
  }
}
