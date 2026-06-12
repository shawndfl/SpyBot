import type { UpdateEvent } from '../core/UpdateEvent';

/**
 * Very basic System class. Systems should extend this and implement the update method to perform their logic each frame.
 * Systems are responsible for processing entities that have specific components and updating their state accordingly.
 * For example, a MovementSystem might look for entities with TransformComponent and Velocity components and update their positions based on their velocities.
 */
export abstract class System {
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
