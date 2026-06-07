import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export interface TransformComponentInit {
  position: THREE.Vector3;
  rotation: THREE.Vector3;
  scale: THREE.Vector3;
}

export class TransformComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(TransformComponent);
  }

  private _root: THREE.Object3D = new THREE.Object3D();

  get root(): THREE.Object3D {
    return this._root;
  }

  get position(): THREE.Vector3 {
    return this._root.position;
  }
  get rotation(): THREE.Euler {
    return this._root.rotation;
  }

  get scale(): THREE.Vector3 {
    return this._root.scale;
  }

  constructor(init?: Partial<TransformComponentInit>) {
    super();
    this._root.position.set(init?.position?.x || 0, init?.position?.y || 0, init?.position?.z || 0);
    this._root.rotation.set(init?.rotation?.x || 0, init?.rotation?.y || 0, init?.rotation?.z || 0, 'YXZ');
    this._root.scale.set(init?.scale?.x || 1, init?.scale?.y || 1, init?.scale?.z || 1);
  }
}
