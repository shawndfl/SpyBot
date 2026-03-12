import * as THREE from 'three';
import { InputSystem } from '../systems/InputSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { World } from './World';
import { EventBus } from './EventSystem';
import { WorldBuilder } from '../worlds/WorldBuilder';
import { InitializeEvent } from '../events/InitializeEvent';

export class Engine {
  private timer = new THREE.Timer();
  private accumulator = 0;
  private fixedStep = 1 / 60;

  private _world = new World();
  //
  // Systems
  //
  private _input: InputSystem;
  private _render: RenderSystem;
  private _movement: InputSystem;
  private _firstLoad: boolean = true;

  protected _eventBus: EventBus;

  get world(): World {
    return this._world;
  }

  constructor() {
    this._input = new InputSystem();
    this._render = new RenderSystem();
    this._movement = new InputSystem();
    this._eventBus = new EventBus();
  }

  initialize(): void {
    // build the initial level
    const builder = new WorldBuilder(this._world);
    builder.addPlayer();

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
    this._eventBus.clear();
    const events = this._eventBus;
    const world = this._world;

    if (this._firstLoad) {
      this._eventBus.emit(new InitializeEvent());
      this._firstLoad = false;
    }

    this._input.update(world, delta, events);
    this._movement.update(world, delta, events);

    this._render.update(world, delta, events);

    this._input.resetFrameInputs();
  }
}
