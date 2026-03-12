import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentNames } from '../ecs/ComponentNames';

export class Transform extends Component {
  position: THREE.Vector3 = new THREE.Vector3();
  rotation: THREE.Euler = new THREE.Euler();
  scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  get name(): ComponentNames {
    return ComponentNames.Transform;
  }
}
