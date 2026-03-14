import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Sky } from 'three/addons/objects/Sky.js';

export class GameSky {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private sky: Sky;
  private sun: THREE.Vector3;
  private gui: GUI;
  private onGuiChanged: () => void;

  /// GUI

  effectController = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
    exposure: 0,
    cloudCoverage: 0.4,
    cloudDensity: 0.4,
    cloudElevation: 0.5,
  };

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, gui: GUI) {
    this.scene = scene;
    this.gui = gui;
    this.onGuiChanged = this.guiChanged.bind(this);

    const helper = new THREE.GridHelper(100, 200, 0xffffff, 0xffffff);
    scene.add(helper);

    this.renderer = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    document.body.appendChild(renderer.domElement);

    this.sky = new Sky();
    this.sun = new THREE.Vector3();
  }

  initialize() {
    this.effectController.exposure = this.renderer.toneMappingExposure;
    this.initSky();
    this.guiChanged();
  }

  private guiChanged(): void {
    const effectController = this.effectController;
    const uniforms = this.sky.material.uniforms;
    uniforms['turbidity'].value = effectController.turbidity;
    uniforms['rayleigh'].value = effectController.rayleigh;
    uniforms['mieCoefficient'].value = effectController.mieCoefficient;
    uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;
    uniforms['cloudCoverage'].value = effectController.cloudCoverage;
    uniforms['cloudDensity'].value = effectController.cloudDensity;
    uniforms['cloudElevation'].value = effectController.cloudElevation;

    const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
    const theta = THREE.MathUtils.degToRad(effectController.azimuth);

    this.sun.setFromSphericalCoords(1, phi, theta);

    uniforms['sunPosition'].value.copy(this.sun);

    this.renderer.toneMappingExposure = effectController.exposure;
  }

  private initSky() {
    const effectController = this.effectController;
    // Add Sky
    this.sky.scale.setScalar(450);
    this.scene.add(this.sky);
    const gui = this.gui;

    gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(this.onGuiChanged);
    gui.add(effectController, 'rayleigh', 0.0, 4, 0.001).onChange(this.onGuiChanged);
    gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(this.onGuiChanged);
    gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(this.onGuiChanged);
    gui.add(effectController, 'elevation', 0, 90, 0.1).onChange(this.onGuiChanged);
    gui.add(effectController, 'azimuth', -180, 180, 0.1).onChange(this.onGuiChanged);
    gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(this.onGuiChanged);

    const folderClouds = gui.addFolder('Clouds');
    folderClouds.add(effectController, 'cloudCoverage', 0, 1, 0.01).name('coverage').onChange(this.onGuiChanged);
    folderClouds.add(effectController, 'cloudDensity', 0, 1, 0.01).name('density').onChange(this.onGuiChanged);
    folderClouds.add(effectController, 'cloudElevation', 0, 1, 0.01).name('elevation').onChange(this.onGuiChanged);
  }

  update(dt: number) {
    this.sky.material.uniforms['time'].value = performance.now() * 0.001;
  }
}
