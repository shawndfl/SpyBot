import * as THREE from 'three';
import { InputSystem } from '../systems/InputSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { World } from '../ecs/World';
import { SceneFactory } from '../scenes/factories/SceneFactory';
import { MovementSystem } from '../systems/MovementSystem';
import type { UpdateEvent } from './UpdateEvent';
import { CommandBuffer } from '../ecs/CommandBuffer';

import { PlayerComponent } from '../components/PlayerComponent';
import { Transform } from '../components/Transform';
import { ComponentRegistry, type ComponentCtor } from '../ecs/ComponentRegistry';
import { LightInitSystem } from '../systems/rendering/LightInitSystem';
import { LightSyncSystem } from '../systems/rendering/LightSyncSystem';
import { RenderInitSystem } from '../systems/RenderInitSystem';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';
import { RendererComponent } from '../components/mesh/RendererComponent';
import { LightComponent } from '../components/lights/LightComponent';
import { SunLightComponent } from '../components/SunLightComponent';
import { EventBus } from '../ecs/EventBus';
import { AnimationSystem } from '../systems/AnimationSystem';
import { AnimationComponent } from '../components/AnimationComponent';

/**
 * This is the engine that runs the game. It creates an instance of the world and adds all
 * the systems to it in order. This also holds an instance of the THREE.Scene
 */
export class Engine {
  private timer = new THREE.Timer();
  private accumulator = 0;
  private fixedStep = 1 / 60;

  private _world;

  private _scene: THREE.Scene = new THREE.Scene();
  private _renderer = new THREE.WebGLRenderer({ antialias: true });

  private _sceneFactory: SceneFactory;

  private _inputSystem: InputSystem;

  protected _eventBus: EventBus;
  protected _command: CommandBuffer;

  get world(): World {
    return this._world;
  }

  constructor() {
    const fn = (x: ComponentCtor) => ComponentRegistry.getId(x);

    const scene = this._scene;
    const renderer = this._renderer;

    this._inputSystem = new InputSystem(fn(Transform));
    this._world = new World([
      this._inputSystem,

      new MovementSystem(fn(PlayerComponent) | fn(Transform)),
      new LightInitSystem(fn(RendererComponent) | fn(Transform), scene),
      new LightSyncSystem(fn(RendererComponent) | fn(Transform) | fn(LightComponent), scene),
      new RenderInitSystem(fn(Transform) | fn(MeshGlbComponent), scene),
      new AnimationSystem(fn(AnimationComponent)),
      new RenderSystem(fn(RendererComponent) | fn(Transform) | fn(SunLightComponent), scene, renderer),
    ]);
    this._eventBus = new EventBus();
    this._command = new CommandBuffer();
    this._sceneFactory = new SceneFactory();
  }

  initialize(): void {
    // build the initial game scene
    const gameScene = this._sceneFactory.createScene('smallTown');
    gameScene.create(this._world, this._scene, this._renderer);

    // initialize all the systems
    for (let system of this._world.systems) {
      system.initialize();
    }
  }

  run() {
    requestAnimationFrame(this.run.bind(this));

    this.timer.update();
    const maxFrameDelay = 0.25;
    const delta = Math.min(this.timer.getDelta(), maxFrameDelay);
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
