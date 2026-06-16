import RAPIER from '@dimforge/rapier3d-compat';

/**
 * Wrap the physics context
 */
export class PhysicsContext {
  private _world?: RAPIER.World;
  private _eventQueue?: RAPIER.EventQueue;

  private _ready?: boolean;
  private _promise: Promise<void>;

  get world(): RAPIER.World {
    if (!this._world) {
      throw new Error('PhysicsContext is not ready');
    }

    return this._world;
  }

  get eventQueue(): RAPIER.EventQueue {
    if (!this._eventQueue) {
      throw new Error('PhysicsContext is not ready');
    }

    return this._eventQueue;
  }

  get loadPromise(): Promise<void> {
    return this._promise;
  }

  get isReady(): boolean {
    return !!this._ready;
  }

  constructor() {
    this._promise = RAPIER.init().then(() => {
      this._world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
      this._eventQueue = new RAPIER.EventQueue(true);
      this._ready = true;
    });
  }

  step(dt: number) {
    if (this._ready) {
      this.world.timestep = Math.min(dt, 1 / 30);
      this.world.step(this.eventQueue);
    }
  }
}
