import { BattleTriggerComponent } from '../components/BattleTriggerComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { EntityTriggerEvent } from '../events/EntityTriggerEvent';
import { BattleState } from '../gameStates/BattleState';

export class EntityTriggerDispatchSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    // process all trigger events
    for (let event of events.get(EntityTriggerEvent)) {
      // if there is a battle trigger
      if (event.triggerEvent == 'trigger-enter') {
        const battleTriggerComponent =
          world.getComponent(event.entityA, BattleTriggerComponent) ||
          world.getComponent(event.entityB, BattleTriggerComponent);

        if (battleTriggerComponent) {
          commands.requestTransition({
            context: battleTriggerComponent.context,
            gameState: new BattleState(),
            type: 'push',
          });
          return;
        }
      }

      console.debug('collision ', event.triggerEvent, event);
    }
  }
}
