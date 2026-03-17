import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentMask } from '../ecs/ComponentNames';

export class Transform extends Component {
  get mask(): ComponentMask {
    return ComponentMask.Transform;
  }
  position: THREE.Vector3 = new THREE.Vector3();
  rotation: THREE.Euler = new THREE.Euler();
  scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  constructor() {
    super();
  }
  setPosition(position: THREE.Vector3): Transform {
    this.position.set(position.x, position.y, position.z);
    return this;
  }
}

//type ComponentCtor<T extends Component = Component> = new (...args: any[]) => T;

//type InstanceTuple<T extends readonly ComponentCtor[]> = {
//  [K in keyof T]: T[K] extends ComponentCtor<infer R> ? R : never;
//};

//const t: ComponentCtor<Transform> = new Transform();
//console.debug(t);
