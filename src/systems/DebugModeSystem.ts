//import * as THREE from 'three';
import { System } from '../ecs/System';
import type { UpdateEvent } from '../core/UpdateEvent';
import { CameraComponent } from '../components/CameraComponent';
import { ConstraintComponent } from '../components/ConstraintComponent';
import { GameInputEvent } from '../events/GameInputEvent';

export class DebugModeSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    // debug
    for (let [entity, cameraComponent] of world.queryWithEntity(CameraComponent)) {
      const [inputEvents] = events.get(GameInputEvent);

      if (inputEvents.payload.state.debugModeToggle) {
        cameraComponent.debugMode = !cameraComponent.debugMode;
      }

      const constraint = world.getComponent(entity, ConstraintComponent);
      if (constraint) {
        constraint.enabled = !cameraComponent.debugMode;
      }
    }
  }
}
