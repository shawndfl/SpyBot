import * as THREE from 'three';

import type { UpdateEvent } from './UpdateEvent';
import { CommandBuffer } from '../ecs/CommandBuffer';
import { EventBus } from '../ecs/EventBus';

import { GamesStateFactory } from './GameStateFactory';
import { GameStateManager } from './GameStateManager';
import { PhysicsContext } from './PhysiscContext';
import { AssetManager } from './AssetManager';
import { LoadingState } from '../gameStates/LoadingState';
import { SmallTownState } from '../gameStates/SmallTownState';

/**
 * This is the engine that runs the game. It creates an instance of the world and adds all
 * the systems to it in order. This also holds an instance of the THREE.Scene
 */
export class Engine {
  private timer = new THREE.Timer();
  private accumulator = 0;
  private fixedStep = 1 / 60;

  private static _renderer = new THREE.WebGLRenderer({ antialias: true });
  private static _physics = new PhysicsContext();
  private static _assets = new AssetManager();

  protected _eventBus: EventBus;
  protected _command: CommandBuffer;
  protected _gameStateFactory: GamesStateFactory;
  protected _gameStateManager: GameStateManager;

  public static get physicsContext(): PhysicsContext {
    return this._physics;
  }

  public static get assets(): AssetManager {
    return this._assets;
  }

  public static get renderer(): THREE.WebGLRenderer {
    return this._renderer;
  }

  constructor() {
    this._eventBus = new EventBus();
    this._command = new CommandBuffer();
    this._gameStateFactory = new GamesStateFactory();
    this._gameStateManager = new GameStateManager();
  }

  initialize(): void {
    // build the initial game state

    //const gameState = this._gameStateFactory.create('SmallTown');
    //this._gameStateManager.push(gameState);

    //TODO add loading state then
    this._gameStateManager.push(new LoadingState(), {
      assetManifest: {
        glbs: ['player.glb', 'lampPost.glb', 'NpcY.glb', 'knight.glb'],
        sounds: [],
        textures: ['grass.jpg'],
        physics: true,
      },
      nextStateAfterLoading: {
        context: {},
        gameState: new SmallTownState(),
        type: 'change',
      },
    });
  }

  run() {
    requestAnimationFrame(this.run.bind(this));

    this.timer.update();
    const maxFrameDelay = 0.25;
    const delta = Math.min(this.timer.getDelta(), maxFrameDelay);
    this.accumulator += delta;

    if (this.accumulator >= this.fixedStep) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }
  }

  protected update(delta: number): void {
    const events = this._eventBus;

    // clear out all old events
    events.clear();

    // create the events. Each state will have its own world
    const updateEvents: UpdateEvent = {
      world: null!, // Each state has its own world
      commands: this._command,
      dt: delta,
      events,
    };

    // update the state
    this._gameStateManager.update(updateEvents);

    // change state
    const transition = this._command.consumeTransitionRequest();
    this._gameStateManager.handleTransition(transition);

    // flush commands
    this._command.flush(this._gameStateManager);
  }
}
