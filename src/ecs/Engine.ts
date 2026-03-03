import * as THREE from 'three';
import { InputSystem } from '../systems/InputSystem';
import { RenderSystem } from '../systems/RenderSystem';

export class Engine {
  private timer = new THREE.Timer();
  private accumulator = 0;
  private fixedStep = 1 / 60;
  private _input: InputSystem;
  private _render: RenderSystem;

  constructor() {
    this._input = new InputSystem();
    this._render = new RenderSystem();
  }

  initialize(): void {
    this._input.initialize();
    this._render.initialize();
  }

  run() {
    requestAnimationFrame(this.run.bind(this));

    this.timer.update();

    const delta = this.timer.getDelta();
    this.accumulator += delta;

    while (this.accumulator >= this.fixedStep) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }
  }

  private update(delta: number): void {
    /*
        Input
        Gameplay Logic
        Physics Step
        Collision Events
        Sync Physics → Transform
        Animation
        Render
        Reset Frame Inputs
        */
    this._input.update(this, delta);

    this._render.update(this, delta);
    this._input.resetFrameInputs();
  }
}
