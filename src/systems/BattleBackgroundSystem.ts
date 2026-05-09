import * as THREE from 'three';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import Engine from '../battleBackgrounds/engine';
import bgDataUrl from '../assets/data/truncated_backgrounds.dat?url';
import BackgroundLayer from '../battleBackgrounds/rom/background_layer';
import ROM from '../battleBackgrounds/rom/rom';
import { BattleBackgroundComponent } from '../components/BattleBackgroundComponent.js';

/**
 * This system will create the background display in most battle scenes
 */
export class BattleBackgroundSystem extends System {
  private _canvas2D?: HTMLCanvasElement;
  private _bgScene = new THREE.Scene();
  private _bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private _bgTexture?: THREE.CanvasTexture;

  constructor(componentMask: number, private _renderer: THREE.WebGLRenderer) {
    super(componentMask);
  }

  update({ world, dt }: UpdateEvent): void {
    for (let [battleBg] of world.query(BattleBackgroundComponent)) {
      if (!battleBg.backgroundEngine && !battleBg.loadingBattlePromise) {
        this.create(battleBg);
      }

      if (!battleBg.loadingBattlePromise) {
        battleBg.backgroundEngine?.update(dt * 1000);
        this.drawBackground();
      }
    }
  }

  create(battleBg: BattleBackgroundComponent): void {
    if (!this._canvas2D) {
      this._canvas2D = this.createCanvas2D();
      document.body.append(this._canvas2D);
    }

    battleBg.loadingBattlePromise = this.buildBackground(battleBg)
      .then(() => {
        //disable loading screen
      })
      .catch((e) => {
        console.error('Error loading background!', e);
      });
  }

  protected async buildBackground(battleBg: BattleBackgroundComponent): Promise<void> {
    const response = await fetch(bgDataUrl);
    const buffer = await response.arrayBuffer();
    const backgroundData = new Uint8Array(buffer);

    const rom = new ROM(backgroundData);
    const layer1 = new BackgroundLayer(271, rom);
    const layer2 = new BackgroundLayer(269, rom);
    const fps = 30;

    battleBg.backgroundEngine = new Engine([layer1, layer2], {
      fps: fps,
      aspectRatio: 0,
      frameSkip: 1,
      alpha: [0.7, 0.7],
      canvas: this._canvas2D,
    });
    battleBg.backgroundEngine.initialize();
    // setup the a random back ground
    battleBg.backgroundEngine.layers[0].loadEntry(Math.floor(Math.random() * 325));
    battleBg.backgroundEngine.layers[1].loadEntry(Math.floor(Math.random() * 325));
    battleBg.loadingBattlePromise = undefined;

    // create the texture for this
    this._bgTexture = new THREE.CanvasTexture(this._canvas2D);
    this._bgTexture.colorSpace = THREE.SRGBColorSpace;
    this._bgTexture.needsUpdate = true;
    const bgMaterial = new THREE.MeshBasicMaterial({
      map: this._bgTexture,
      depthTest: false,
      depthWrite: false,
    });

    const bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);

    bgPlane.renderOrder = -999;
    this._bgScene.add(bgPlane);
  }

  private createCanvas2D(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    canvas.width = 800;
    canvas.height = 600;
    return canvas;
  }

  protected drawBackground(): void {
    if (!this._bgTexture) {
      return;
    }

    this._bgTexture.needsUpdate = true;
    this._renderer.autoClear = false;

    this._renderer.clear(true, true, true);

    //this._renderer.autoClear = true;
    this._renderer.render(this._bgScene, this._bgCamera);

    this._renderer.clearDepth();
  }
}
