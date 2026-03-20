import * as THREE from 'three';
import { InputSystem } from '../systems/InputSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { InitializeEvent } from '../events/InitializeEvent';
import { World } from '../ecs/World';
import { EventBus } from '../ecs/EventSystem';
import { SceneFactory } from '../scenes/factories/SceneFactory';
import { MovementSystem } from '../systems/MovementSystem';
import type { UpdateEvent } from './UpdateEvent';
import { CommandBuffer } from '../ecs/CommandBuffer';

import { Player } from '../components/Player';
import { Renderer } from '../components/Renderer';
import { SunLight } from '../components/SunLight';
import { Transform } from '../components/Transform';
import { ComponentRegistry, type ComponentCtor } from '../ecs/ComponentRegistry';

ComponentRegistry.register(Player, Renderer, Transform, SunLight);

export class Engine {
  private timer = new THREE.Timer();
  private accumulator = 0;
  private fixedStep = 1 / 60;

  private _world;

  private _firstLoad: boolean = true;
  private _sceneFactory: SceneFactory;

  private _inputSystem: InputSystem;

  protected _eventBus: EventBus;
  protected _command: CommandBuffer;

  get world(): World {
    return this._world;
  }

  constructor() {
    const fn = (x: ComponentCtor) => ComponentRegistry.getId(x);

    this._inputSystem = new InputSystem(fn(Transform));
    this._world = new World([
      this._inputSystem,
      new RenderSystem(fn(Renderer) | fn(Transform) | fn(SunLight)),
      new MovementSystem(fn(Player) | fn(Transform)),
    ]);
    this._eventBus = new EventBus();
    this._command = new CommandBuffer();
    this._sceneFactory = new SceneFactory();
  }

  initialize(): void {
    // build the initial game scene
    const gameScene = this._sceneFactory.createScene('smallTown');
    gameScene.create(this._world);

    // initialize all the systems
    for (let system of this._world.systems) {
      system.initialize();
    }
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

    const updateEvents: UpdateEvent = {
      commands: this._command,
      dt: delta,
      events,
      world,
    };

    // update all the systems
    for (let system of this._world.systems) {
      system.update(updateEvents);
    }

    this._command.flush(this.world);

    this._inputSystem.resetFrameInputs();
  }
}
