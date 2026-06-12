import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { System } from '../ecs/System';

import type { UpdateEvent } from '../core/UpdateEvent';
import { CameraComponent } from '../components/CameraComponent';

export class RenderSystem extends System {
  private stats: Stats = new Stats();
  private windowResize: () => void;

  private _resizedCalled?: boolean;

  public get scene(): THREE.Scene {
    return this._scene;
  }

  public get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  private _width: number = 0;
  private _height: number = 0;
  private _pixelRatio: number = 0;

  constructor(
    private _scene: THREE.Scene,
    private _renderer: THREE.WebGLRenderer,
  ) {
    super();
    this.windowResize = this.onWindowResize.bind(this);
  }

  initialize(): void {
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.dom);

    window.addEventListener('resize', this.windowResize);
    this.onWindowResize();

    this.renderer.setClearColor(0xcececf); // light blue-gray
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    //const helper = new THREE.GridHelper(100, 200, 0xffffff, 0xffffff);
    //this.scene.add(helper);
  }

  onWindowResize() {
    this._resizedCalled = true;
    this._width = Math.min(window.innerWidth, 1280);
    this._height = Math.min(window.innerWidth, 960);
    this._pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(this._pixelRatio);

    this.renderer.setSize(this._width, this._height);
  }

  update(data: UpdateEvent): void {
    const { world } = data;

    this.renderer.autoClear = false;

    // handle resize for camera
    if (this._resizedCalled) {
      for (let [camera] of world.query(CameraComponent)) {
        camera.camera.aspect = this._width / this._height;
        camera.camera.updateProjectionMatrix();
      }
    }

    // render for each camera
    for (let [component] of world.query(CameraComponent)) {
      this.renderer.render(this.scene, component.camera);
    }

    this.stats.update();

    // reset flag
    this._resizedCalled = false;

    // other systems could have set this to false
    this._renderer.autoClear = true;
  }
}
