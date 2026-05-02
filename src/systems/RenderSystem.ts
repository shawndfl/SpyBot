import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { System } from '../ecs/System';

import type { UpdateEvent } from '../core/UpdateEvent';
import type { IRenderSystem } from './IRenderSystem';
import { SunManager } from '../lights/SunManager';
import { TransformComponent } from '../components/TransformComponent';
import { RendererComponent } from '../components/mesh/RendererComponent';
import { SunLightComponent } from '../components/SunLightComponent';
import { CameraComponent } from '../components/CameraComponent';

export class RenderSystem extends System implements IRenderSystem {
  private _gui: GUI = new GUI();

  private _sunManager: SunManager;

  private stats: Stats = new Stats();
  private windowResize: () => void;

  private _resizedCalled?: boolean;

  private _orbitControls?: OrbitControls;

  public get scene(): THREE.Scene {
    return this._scene;
  }

  public get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  public get gui(): GUI {
    return this._gui;
  }

  constructor(componentMask: number, private _scene: THREE.Scene, private _renderer: THREE.WebGLRenderer) {
    super(componentMask);
    this._sunManager = new SunManager(this);
    this.windowResize = this.onWindowResize.bind(this);
  }

  initialize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this._sunManager.initialize();

    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(this.stats.dom);

    //TODO disconnect this when done
    window.addEventListener('resize', this.windowResize);

    this.renderer.setClearColor(0xcececf); // light blue-gray
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const helper = new THREE.GridHelper(100, 200, 0xffffff, 0xffffff);
    this.scene.add(helper);

    this.initGui();
  }

  initOrbit(cameraComponent: CameraComponent): void {
    if (this._orbitControls?.object == cameraComponent.camera) {
      return;
    }

    if (!this._orbitControls) {
      this._orbitControls = new OrbitControls(cameraComponent.camera, this.renderer.domElement);
    }
    this._orbitControls.object = cameraComponent.camera;

    this._orbitControls.disconnect();
    (this._orbitControls as any)._onContextMenu = () => {};
    this._orbitControls.connect(this.renderer.domElement);

    this._orbitControls.enablePan = true;
    this._orbitControls.enableZoom = true;
    this._orbitControls.target.set(0, 1, 0);
    this._orbitControls.position0.set(1, 2, 1);
    this._orbitControls.update();
  }

  onWindowResize() {
    this._resizedCalled = true;

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  initGui() {}

  loadGltf(mesh: THREE.Object3D, path?: string): void {
    if (!path) {
      return;
    }
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      const model = gltf.scene;
      this.scene.add(mesh);

      const material = new THREE.MeshPhysicalMaterial();

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = material;
          (child as THREE.Mesh).castShadow = true;
        }
      });
      mesh.add(model);
    });
  }

  update(data: UpdateEvent): void {
    const { world, dt, events, commands } = data;

    // handle resize for camera
    if (this._resizedCalled) {
      for (let [camera] of world.query(CameraComponent)) {
        camera.camera.aspect = window.innerWidth / window.innerHeight;
        camera.camera.updateProjectionMatrix();
      }
    }

    //
    for (let [camera] of world.query(CameraComponent)) {
      if (camera.useOrbit) {
        this.initOrbit(camera);
      }
    }

    for (let [renderers, transform] of world.query(RendererComponent, TransformComponent)) {
      renderers.mesh.position.copy(transform.position);
      renderers.mesh.rotation.copy(transform.rotation);
      renderers.mesh.scale.copy(transform.scale);
    }

    const [light] = world.getComponents(SunLightComponent);

    this._sunManager.setSunState(light);
    this._sunManager.update({ world, dt, events, commands });

    // render for each camera
    for (let [component] of world.query(CameraComponent)) {
      this.renderer.render(this.scene, component.camera);
    }

    this.stats.update();

    // reset flag
    this._resizedCalled = false;
  }
}
