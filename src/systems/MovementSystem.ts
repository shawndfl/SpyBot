import * as THREE from 'three';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { GameInputEvent } from '../events/GameInputEvent';
import { AnimationComponent } from '../components/AnimationComponent';
import { TerrainComponent } from '../components/mesh/TerrainComponent';
import { CameraComponent } from '../components/CameraComponent';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';

export class MovementSystem extends System {
  private tempPosition1: THREE.Vector3 = new THREE.Vector3();
  private tempPosition2: THREE.Vector3 = new THREE.Vector3();
  private tempRotation1: THREE.Quaternion = new THREE.Quaternion();
  private tempRotation2: THREE.Quaternion = new THREE.Quaternion();

  private up: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

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
      for (let [player, transform, animation, rigid] of world.query(
        PlayerComponent,
        TransformComponent,
        AnimationComponent,
        RigidBodyComponent,
      )) {
        if (!rigid.body) {
          continue;
        }
        const rot = rigid.body.rotation();
        this.tempRotation1.set(rot.x, rot.y, rot.z, rot.w);
        const trans = rigid.body.translation();
        this.tempPosition1.x = trans.x;
        this.tempPosition1.y = trans.y;
        this.tempPosition1.z = trans.z;

        if (inputEvents.payload.state.moveX != 0 || inputEvents.payload.state.moveY != 0) {
          const rotate = -inputEvents.payload.state.moveX * player.rotationSpeed * dt;
          const forward = -inputEvents.payload.state.moveY * player.speed * dt;

          // get the current rotation from the rigid body
          this.tempRotation2.setFromAxisAngle(this.up, rotate);
          this.tempRotation1.multiply(this.tempRotation2);

          this.tempPosition2.set(0, 0, 1);
          this.tempPosition2.applyQuaternion(this.tempRotation1);
          this.tempPosition2.normalize();
          this.tempPosition2.multiplyScalar(forward);

          this.tempPosition1.add(this.tempPosition2);

          animation.play('Running');
        } else {
          animation.play('Idle');
        }

        // set the final height
        const height = getHeightFromTerrain! ? getHeightFromTerrain(transform.position.x, transform.position.z) : 0;
        this.tempPosition1.y = height;

        // set the next position
        rigid.body?.setNextKinematicTranslation(this.tempPosition1);

        // set the next rotation
        rigid.body?.setNextKinematicRotation(this.tempRotation1);
      }
    }
  }
}
