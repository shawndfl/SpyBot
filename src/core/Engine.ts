import * as THREE from 'three';

import type { UpdateEvent } from './UpdateEvent';
import { CommandBuffer } from '../ecs/CommandBuffer';
import { EventBus } from '../ecs/EventBus';

import { GamesStateFactory } from './GameStateFactory';
import { GameStateManager } from './GameStateManager';

/**
 * This is the engine that runs the game. It creates an instance of the world and adds all
 * the systems to it in order. This also holds an instance of the THREE.Scene
 */
export class Engine {
  private timer = new THREE.Timer();
  private accumulator = 0;
  private fixedStep = 1 / 60;

  private _scene: THREE.Scene = new THREE.Scene();
  private _renderer = new THREE.WebGLRenderer({ antialias: true });

  protected _eventBus: EventBus;
  protected _command: CommandBuffer;
  protected _gameStateFactory: GamesStateFactory;
  protected _gameStateManager: GameStateManager;

  constructor() {
    this._eventBus = new EventBus();
    this._command = new CommandBuffer();
    this._gameStateFactory = new GamesStateFactory(this._scene, this._renderer);
    this._gameStateManager = new GameStateManager();
  }

  initialize(): void {
    // build the initial game state
    const gameState = this._gameStateFactory.create('SmallTown');
    this._gameStateManager.push(gameState);
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

  protected update(delta: number): void {
    const events = this._eventBus;

    // create the events. Each state will have its own world
    const updateEvents: UpdateEvent = {
      world: null!, // Each state has its own world
      commands: this._command,
      dt: delta,
      events,
    };

    // update the state
    this._gameStateManager.current()?.update(updateEvents);

    // flush commands
    this._command.flush(this._gameStateManager);
  }
}
