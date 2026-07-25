import { BattleTriggerComponent } from '../components/BattleTriggerComponent';
import { DialogComponent } from '../components/DialogComponent';
import { DialogContentComponent } from '../components/DialogContentComponent';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';
import { PlayerComponent } from '../components/PlayerComponent';
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
          const playerIsEntityA = world.getHasComponent(event.entityA, PlayerComponent);
          const playerIsEntityB = world.getHasComponent(event.entityB, PlayerComponent);

          if (!playerIsEntityA && !playerIsEntityB) {
            throw new Error('PlayerComponent is missing!');
          }

          const triggerEntity = playerIsEntityA ? event.entityB : event.entityA;
          const dialogContent = world.getComponent(triggerEntity, DialogContentComponent);

          if (dialog && dialogContent) {
            if (!dialog.visible) {
              dialog.show(
                dialogContent.title,
                dialogContent.text,
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
            }
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
