import * as THREE from 'three';

export class Camera {
  private _camera: THREE.OrthographicCamera = new THREE.OrthographicCamera();

  get camera(): THREE.Camera {
    return this._camera;
  }

  constructor() {
    this.initialize(window.innerWidth, window.innerHeight);
  }

  initialize(width: number, height: number) {
    const aspect = width / height;
    const frustumSize = 1;

    this._camera = new THREE.OrthographicCamera(
      -frustumSize * aspect,
      frustumSize * aspect,
      frustumSize,
      -frustumSize,
      0.01,
      100
    );

    // Classic isometric angle
    this._camera.position.set(1, 1, 1);
    this._camera.lookAt(0, 0, 0);
  }
}
