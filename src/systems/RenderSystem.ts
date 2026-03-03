import * as THREE from 'three';
import { Camera } from '../core/Camera';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { System } from '../ecs/System';
import type { Engine } from '../ecs/Engine';

export class RenderSystem extends System {
  private scene = new THREE.Scene();
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private camera: Camera = new Camera();
  private accumulator: number = 0;
  private stats: Stats = new Stats();
  private gui: GUI = new GUI();
  private ground: THREE.Mesh | undefined;

  initialize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    document.body.appendChild(this.stats.dom);

    // Example cube
    const geometry = new THREE.PlaneGeometry();
    geometry.rotateX(-Math.PI / 2); // Rotate to lie flat on the XZ plane
    geometry.scale(10, 10, 10); // Scale up the plane to make it larger
    const material = new THREE.MeshPhysicalMaterial();
    this.ground = new THREE.Mesh(geometry, material);

    this.scene.add(this.ground);
    this.loadGltf();
    this.initOrbit();
    this.initGui();
    this.createLight();
    this.renderer.setClearColor(0xcececf); // light blue-gray
  }

  initOrbit(): void {
    const controls = new OrbitControls(this.camera.camera, this.renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 1, 0);
    controls.position0.set(1, 2, 1);
    controls.update();
  }

  createLight(): void {
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    this.scene.add(directionalLight);
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    this.scene.add(ambientLight);
  }

  initGui() {
    this.gui = new GUI();
    this.gui.add(this.ground!.rotation, 'y', 0, Math.PI, 0.01).name('Cube Rotation Y');
  }

  loadGltf(): void {
    const loader = new GLTFLoader();
    loader.load('player.glb', (gltf) => {
      const model = gltf.scene;
      const material = new THREE.MeshPhysicalMaterial();
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).material = material;
        }
      });
      this.scene.add(model);
    });
  }

  update(engine: Engine, delta: number): void {
    this.renderer.render(this.scene, this.camera.camera);

    this.stats.update();
  }
}
