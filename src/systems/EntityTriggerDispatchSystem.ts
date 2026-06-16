import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { EntityTriggerEvent } from '../events/EntityTriggerEvent';

export class EntityTriggerDispatchSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    for (let event of events.get(EntityTriggerEvent)) {
      console.debug('collision ', event.triggerEvent, event);
    }
  }
}
