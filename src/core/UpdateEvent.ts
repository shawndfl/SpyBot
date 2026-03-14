import type { CommandBuffer } from '../ecs/CommandBuffer';
import type { World } from '../ecs/World';
import type { GameEvent } from '../events/GameEvent';

/**
 * This file defines the UpdateEvent interface, which represents the data
 * passed to systems during the update phase of the game loop.
 */
export interface UpdateEvent {
  world: World;
  dt: number;

  gameEvents: GameEvent;
  /**
   * A command buffer that systems can use to queue up changes to the world (like adding/removing components
   * or destroying entities) that will be applied after all systems have processed the update event.
   * This allows for safe modifications to the world without affecting the current iteration over entities/components.
   */
  commands: CommandBuffer;
}
