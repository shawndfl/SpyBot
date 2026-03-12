import type { GameEvent } from '../events/GameEvent';
import type { GameEventNames } from '../events/GameEventNames';

/**
 * This file defines a simple EventBus class for managing events in the ECS architecture.
 * The EventBus allows systems to emit events and other systems to listen for specific event types.
 * This can be useful for decoupling systems and enabling communication between them without direct references.
 */
export class EventBus {
  private events: GameEvent[];
  constructor() {
    this.events = [];
  }

  emit(event: GameEvent): void {
    this.events.push(event);
  }

  get(type: GameEventNames): GameEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  clear(): void {
    this.events.length = 0;
  }
}
