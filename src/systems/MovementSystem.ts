import * as THREE from 'three';
import { PlayerComponent } from '../components/PlayerComponent';
import { Transform } from '../components/Transform';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { GameInputEvent } from '../events/GameInputEvent';
import { AnimationComponent } from '../components/AnimationComponent';

export class MovementSystem extends System {
  private speed = 1.5;
  private rotationSpeed = 1.5;

  update({ world, dt, events, commands }: UpdateEvent): void {
    const [inputEvents] = events.get(GameInputEvent);

    if (inputEvents) {
      // player update
      for (let [player, transform, animation] of world.query(PlayerComponent, Transform, AnimationComponent)) {
        if (inputEvents.payload.state.moveX != 0 || inputEvents.payload.state.moveY != 0) {
          const rotate = -inputEvents.payload.state.moveX * this.rotationSpeed * dt;
          const forward = -inputEvents.payload.state.moveY * this.speed * dt;
          transform.rotation.y += rotate;
          const angle = transform.rotation.y;
          const direction = new THREE.Vector3(0, 0, forward);
          //const radians = THREE.MathUtils.degToRad(transform.rotation.y);
          direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

          transform.position.add(direction);
          animation.play('Walk');

          /*
          const scaleX = inputEvents.payload.state.moveX * this.speed * dt;
          const scaleZ = inputEvents.payload.state.moveY * this.speed * dt;
          transform.position.add(new THREE.Vector3(scaleX, 0, scaleZ));
          */
        } else {
          animation.play('Idle');
        }
      }
    }
  }
}
