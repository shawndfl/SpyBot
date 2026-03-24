import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class Transform extends Component {
  get mask(): number {
    return ComponentRegistry.getId(Transform);
  }
  position: THREE.Vector3 = new THREE.Vector3();
  rotation: THREE.Euler = new THREE.Euler();
  scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  constructor() {
    super();
  }

  setPosition(x: number, y: number, z: number): Transform {
    this.position.set(x, y, z);
    return this;
  }
}
