import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class CameraComponent extends Component {
  private _camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  debugMode?: boolean;

  get mask(): number {
    return ComponentRegistry.getId(CameraComponent);
  }

  get camera(): THREE.PerspectiveCamera {
    return this._camera;
  }

  constructor(init?: Partial<CameraComponent>) {
    super();
    Object.assign(this, init);
    this.initialize(window.innerWidth, window.innerHeight);
  }

  initialize(width: number, height: number) {
    this._camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);

    // Classic isometric angle
    this._camera.position.set(10, 10, 10);
    this._camera.lookAt(0, 0, -1);
  }
}
