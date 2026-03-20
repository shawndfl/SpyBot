import * as THREE from 'three';
import { Camera } from '../core/Camera';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { System } from '../ecs/System';
import { GameEventNames } from '../events/GameEventNames';
import { Renderer } from '../components/Renderer';
import type { UpdateEvent } from '../core/UpdateEvent';
import { SunLight } from '../components/SunLight';
import type { IRenderSystem } from './IRenderSystem';
import { SunManager } from '../lights/SunManager';
import { Transform } from '../components/Transform';

export class RenderSystem extends System implements IRenderSystem {
  private _scene = new THREE.Scene();
  private _renderer = new THREE.WebGLRenderer({ antialias: true });
  private _gui: GUI = new GUI();

  private _sunManager: SunManager;

  private camera: Camera = new Camera();
  private stats: Stats = new Stats();
  private ground: THREE.Mesh | undefined;
  private windowResize: () => void;

  public get scene(): THREE.Scene {
    return this._scene;
  }

  public get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  public get gui(): GUI {
    return this._gui;
  }

  constructor(componentMask: number) {
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

    // Example cube
    const geometry = new THREE.PlaneGeometry();
    geometry.rotateX(-Math.PI / 2); // Rotate to lie flat on the XZ plane
    geometry.scale(10, 10, 10); // Scale up the plane to make it larger
    const material = new THREE.MeshPhysicalMaterial();
    this.ground = new THREE.Mesh(geometry, material);
    this.ground.receiveShadow = true;

    //const helper = new THREE.GridHelper(100, 200, 0xffffff, 0xffffff);
    //this.scene.add(helper);

    this.scene.add(this.ground);
    this.initOrbit();
    this.initGui();
  }

  initOrbit(): void {
    const controls = new OrbitControls(this.camera.camera, this.renderer.domElement);
    controls.disconnect();
    (controls as any)._onContextMenu = () => {};
    controls.connect(this.renderer.domElement);

    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 1, 0);
    controls.position0.set(1, 2, 1);
    controls.update();
  }

  onWindowResize() {
    this.camera.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateSun(l: SunLight): void {}

  initGui() {
    this.gui.add(this.ground!.rotation, 'y', 0, Math.PI, 0.01).name('Cube Rotation Y');
  }

  loadGltf(path?: string): void {
    if (!path) {
      return;
    }
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      const model = gltf.scene;
      const material = new THREE.MeshPhysicalMaterial();
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = material;
          (child as THREE.Mesh).castShadow = true;
        }
      });
      this.scene.add(model);
    });
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    const [initializeEvent] = events.get(GameEventNames.InitializeLevel);
    if (initializeEvent) {
      for (let [renderers] of world.query(Renderer, Transform)) {
        this.loadGltf((renderers as Renderer).gltfName);
      }
    }

    const [light] = world.getComponents(SunLight);

    this._sunManager.setSunState(light);
    this._sunManager.update({ world, dt, events, commands });

    this.renderer.render(this.scene, this.camera.camera);

    this.stats.update();
  }
}
