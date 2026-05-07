import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class VelocityComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(VelocityComponent);
  }

  value: THREE.Vector3 = new THREE.Vector3();

  constructor(init?: Partial<VelocityComponent>) {
    super();
    Object.assign(this, init);
  }
}
