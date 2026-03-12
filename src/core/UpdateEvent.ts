import type { World } from '../ecs/World';
import type { GameEvent } from '../events/GameEvent';

export interface UpdateEvent {
  world: World;
  dt: number;
  gameEvents: GameEvent;
}
