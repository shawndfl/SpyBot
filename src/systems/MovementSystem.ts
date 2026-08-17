import * as THREE from 'three';
import { PlayerComponent } from '../components/PlayerComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { GameInputEvent } from '../events/GameInputEvent';
import { AnimationComponent } from '../components/AnimationComponent';
import { CameraComponent } from '../components/CameraComponent';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';
import { TerrainHeightResource } from '../procedural/resources/TerrainHeightResource';
import { PlayerCameraRigComponent } from '../components/PlayerCameraRigComponent';

export class MovementSystem extends System {
  private tempPosition1: THREE.Vector3 = new THREE.Vector3();
  private moveDirection: THREE.Vector3 = new THREE.Vector3();
  private forward: THREE.Vector3 = new THREE.Vector3();
  private right: THREE.Vector3 = new THREE.Vector3();
  private tempRotation1: THREE.Quaternion = new THREE.Quaternion();

  private up: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  update({ world, dt, events, commands }: UpdateEvent): void {
    const [inputEvents] = events.get(GameInputEvent);

    if (inputEvents) {
      for (let [camera] of world.query(CameraComponent)) {
        if (camera.debugMode) {
          return;
        }
      }

      const terrain = world.resources.hasResource(TerrainHeightResource)
        ? world.resources.getResource(TerrainHeightResource)
        : undefined;
      const rigResult = world.query(PlayerCameraRigComponent).next();
      const cameraRig = rigResult.done ? undefined : rigResult.value[0];

      // update the player rigidy body component. This should not update the
      // transformComponent because the rigid body is the source of truth.
      // transformComponent will be update in the physicsSystem
      for (let [player, animation, rigid] of world.query(PlayerComponent, AnimationComponent, RigidBodyComponent)) {
        if (!rigid.body) {
          continue;
        }
        const rot = rigid.body.rotation();
        this.tempRotation1.set(rot.x, rot.y, rot.z, rot.w);
        if (cameraRig) {
          this.tempRotation1.setFromAxisAngle(this.up, cameraRig.yaw);
        }
        const trans = rigid.body.translation();
        this.tempPosition1.x = trans.x;
        this.tempPosition1.y = trans.y;
        this.tempPosition1.z = trans.z;

        if (inputEvents.payload.state.moveX != 0 || inputEvents.payload.state.moveY != 0) {
          this.forward.set(0, 0, -1).applyQuaternion(this.tempRotation1);
          this.right.set(1, 0, 0).applyQuaternion(this.tempRotation1);
          this.moveDirection
            .set(0, 0, 0)
            .addScaledVector(this.forward, inputEvents.payload.state.moveY)
            .addScaledVector(this.right, inputEvents.payload.state.moveX)
            .normalize()
            .multiplyScalar(player.speed * dt);
          this.tempPosition1.add(this.moveDirection);

          if (inputEvents.payload.state.moveX > 0) {
            animation.play('Strafe_right', 0, -1);
          } else if (inputEvents.payload.state.moveX < 0) {
            animation.play('Strafe_right', 0, 1);
          } else {
            animation.play('Running');
          }
        } else {
          animation.play('Idle');
        }

        // set the final height
        const height = terrain?.getHeight(this.tempPosition1.x, this.tempPosition1.z) ?? 0;
        this.tempPosition1.y = height;

        // set the next position
        rigid.body?.setNextKinematicTranslation(this.tempPosition1);

        // set the next rotation
        rigid.body?.setNextKinematicRotation(this.tempRotation1);
      }
    }
  }
}
