import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class TransformComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(TransformComponent);
  }

  position: THREE.Vector3 = new THREE.Vector3();
  rotation: THREE.Euler = new THREE.Euler();
  scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  constructor(init?: Partial<TransformComponent>) {
    super();
    Object.assign(this, init);
  }

  setPosition(x: number, y: number, z: number): TransformComponent {
    this.position.set(x, y, z);
    return this;
  }
}
