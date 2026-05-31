import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Sky } from 'three/addons/objects/Sky.js';

export class GameSky {
  //private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private _sky: Sky;
  private sun: THREE.Vector3;
  private gui?: GUI;
  private onGuiChanged: () => void;
  //private _time: number;

  get sky(): Sky {
    return this._sky;
  }

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

  constructor(renderer: THREE.WebGLRenderer, gui?: GUI) {
    this.gui = gui;
    this.onGuiChanged = this.guiChanged.bind(this);

    this.renderer = renderer;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    document.body.appendChild(renderer.domElement);

    this._sky = new Sky();
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

  /**
   * Sets the sun's position given an azimuth and elevation
   * @param azimuth - in radians
   * @param elevation - in radians
   */
  setSunPosition(azimuth: number, elevation: number): void {
    this.sun.setFromSphericalCoords(1, Math.PI / 2.0 - elevation, azimuth);

    const uniforms = this.sky.material.uniforms;
    uniforms['sunPosition'].value.copy(this.sun);
  }

  private initSky() {
    /*
    const effectController = this.effectController;
    // Add Sky
    this.sky.scale.setScalar(450);
    const gui = this.gui;
    if (gui) {
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
      */
  }
}
