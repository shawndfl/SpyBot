import * as THREE from 'three';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { GameInputEvent } from '../events/GameInputEvent';
import { AnimationComponent } from '../components/AnimationComponent';
import { TerrainComponent } from '../components/mesh/TerrainComponent';
import { CameraComponent } from '../components/CameraComponent';

export class MovementSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    const [inputEvents] = events.get(GameInputEvent);

    if (inputEvents) {
      for (let [camera] of world.query(CameraComponent)) {
        if (camera.debugMode) {
          return;
        }
      }

      let [[terrainComponent]] = world.query(TerrainComponent);
      let getHeightFromTerrain = terrainComponent?.getHeight;

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

          animation.play('Running');

          /*
          const scaleX = inputEvents.payload.state.moveX * this.speed * dt;
          const scaleZ = inputEvents.payload.state.moveY * this.speed * dt;
          transform.position.add(new THREE.Vector3(scaleX, 0, scaleZ));
          */
        } else {
          animation.play('Idle');
        }
        const height = getHeightFromTerrain! ? getHeightFromTerrain(transform.position.x, transform.position.z) : 0;
        transform.position.y = height;
      }
    }
  }
}
