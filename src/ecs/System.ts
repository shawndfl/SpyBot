import type { UpdateEvent } from '../core/UpdateEvent';
import type { Entity } from './Entity';

/**
 * Very basic System class. Systems should extend this and implement the update method to perform their logic each frame.
 * Systems are responsible for processing entities that have specific components and updating their state accordingly.
 * For example, a MovementSystem might look for entities with TransformComponent and Velocity components and update their positions based on their velocities.
 */
export abstract class System {
  protected _entities: Set<Entity>;

  get mask(): number {
    return this._mask;
  }

  get entities(): Set<Entity> {
    return this._entities;
  }

  constructor(private _mask: number) {
    this._entities = new Set();
  }

  initialize(): void {}

  /**
   * This method is called once when the system is added to the world.
   * It can be used for any initialization logic that the system needs before it starts processing entities.
   * @param world The world instance, which provides access to entities and their components.
   *        Systems can query the world for entities with specific components and update them accordingly.
   * @param delta The time delta since the last update in seconds, which can be used for time-based calculations (e.g., movement based on velocity).
   * @param events An event bus that systems can use to emit and listen for events. This allows systems to communicate with each other without direct references, enabling a more decoupled architecture.
   */
  abstract update({ world, dt, events, commands }: UpdateEvent): void;
}
