import { BattleTriggerComponent } from '../components/BattleTriggerComponent';
import { DialogComponent } from '../components/DialogComponent';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';
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
        const rigidBodyA = world.getComponent(event.entityA, RigidBodyComponent);
        const rigidBodyB = world.getComponent(event.entityB, RigidBodyComponent);
        const hitKinematic = rigidBodyA?.type === 'kinematic' || rigidBodyB?.type === 'kinematic';
        const battleTriggerComponent =
          world.getComponent(event.entityA, BattleTriggerComponent) ||
          world.getComponent(event.entityB, BattleTriggerComponent);

        if (hitKinematic) {
          const [[dialog]] = world.query(DialogComponent);

          if (dialog && !dialog.visible) {
            dialog.show(
              'Strange Signal',
              'The air shimmers around the marker. Something is waiting just beyond the edge of town. The signal pulses once, then again, like it is answering your footsteps. A thin line of blue light crawls across the ground and points toward the old road. For a moment, the whole town goes quiet.',
              battleTriggerComponent
                ? () => {
                    commands.requestTransition({
                      context: battleTriggerComponent.context,
                      gameState: new BattleState(),
                      type: 'push',
                    });
                  }
                : undefined,
            );
            return;
          }
        }

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
