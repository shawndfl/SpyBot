import type { Entity } from '../ecs/Entity';
import { GameEvent } from './GameEvent';
import { GameEventNames } from './GameEventNames';
/**
 * This is a trigger event raised by the PhysicsSystem
 */
export class EntityTriggerEvent extends GameEvent {
  public get type(): string {
    return GameEventNames.EntityTriggerEvent;
  }

  get triggerEvent(): 'trigger-enter' | 'trigger-exit' {
    return this._triggerEvent;
  }

  get entityA(): Entity {
    return this._entityA;
  }

  get entityB(): Entity {
    return this._entityB;
  }

  constructor(
    private _triggerEvent: 'trigger-enter' | 'trigger-exit',
    private _entityA: Entity,
    private _entityB: Entity,
  ) {
    super();
  }
}
