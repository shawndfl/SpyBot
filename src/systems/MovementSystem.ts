import * as THREE from 'three';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { GameInputEvent } from '../events/GameInputEvent';
import { AnimationComponent } from '../components/AnimationComponent';
import { CameraComponent } from '../components/CameraComponent';
import { ConstraintComponent } from '../components/ConstraintComponent';
import { TerrainComponent } from '../components/mesh/TerrainComponent';

export class MovementSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    const [inputEvents] = events.get(GameInputEvent);

    if (inputEvents) {
      let getHeightFromTerrain: (x: number, z: number) => number;

      for (let [terrainComponent] of world.query(TerrainComponent)) {
        getHeightFromTerrain = terrainComponent.getHeight!;
      }
      // player update
      for (let [player, transform, animation] of world.query(PlayerComponent, TransformComponent, AnimationComponent)) {
        if (inputEvents.payload.state.moveX != 0 || inputEvents.payload.state.moveY != 0) {
          const rotate = -inputEvents.payload.state.moveX * player.rotationSpeed * dt;
          const forward = -inputEvents.payload.state.moveY * player.speed * dt;
          transform.rotation.y += rotate;
          const angle = transform.rotation.y;
          const direction = new THREE.Vector3(0, 0, forward);
          //const radians = THREE.MathUtils.degToRad(transform.rotation.y);
          direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

          transform.position.add(direction);
          const height = getHeightFromTerrain! ? getHeightFromTerrain(transform.position.x, transform.position.z) : 0;
          transform.position.y = height;

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

      // debug
      for (let [cameraComponent, constraint] of world.query(CameraComponent, ConstraintComponent)) {
        if (inputEvents.payload.state.selectJustReleased) {
          cameraComponent.useOrbit = !cameraComponent.useOrbit;
          constraint.enabled = !cameraComponent.useOrbit;
        }
      }
    }
  }
}
