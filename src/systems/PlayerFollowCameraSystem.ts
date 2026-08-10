import * as THREE from 'three';
import { CameraComponent } from '../components/CameraComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

export interface PlayerFollowCameraOptions {
  offset?: THREE.Vector3;
  lookAtOffset?: THREE.Vector3;
  followSharpness?: number;
  orbitSharpness?: number;
}

/**
 * Orbits the overworld camera with the player's yaw so it remains behind the
 * player and looks ahead in the direction the player is facing.
 */
export class PlayerFollowCameraSystem extends System {
  private readonly offset: THREE.Vector3;
  private readonly lookAtOffset: THREE.Vector3;
  private readonly followSharpness: number;
  private readonly orbitSharpness: number;
  private readonly desiredPosition = new THREE.Vector3();
  private readonly desiredTarget = new THREE.Vector3();
  private readonly playerYaw = new THREE.Quaternion();
  private readonly orientationCamera = new THREE.PerspectiveCamera();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private smoothedYaw?: number;

  constructor(options: PlayerFollowCameraOptions = {}) {
    super();
    this.offset = options.offset?.clone() ?? new THREE.Vector3(0, 5, 15);
    this.lookAtOffset = options.lookAtOffset?.clone() ?? new THREE.Vector3(0, 1, -6);
    this.followSharpness = options.followSharpness ?? 8;
    this.orbitSharpness = options.orbitSharpness ?? 5;
  }

  update({ world, dt }: UpdateEvent): void {
    let playerTransform: TransformComponent | undefined;
    for (const [, transform] of world.query(PlayerComponent, TransformComponent)) {
      playerTransform = transform;
      break;
    }

    if (!playerTransform) {
      return;
    }

    const targetYaw = playerTransform.rotation.y;
    if (this.smoothedYaw === undefined) {
      this.smoothedYaw = targetYaw;
    } else {
      const orbitAmount = this.orbitSharpness <= 0 ? 1 : 1 - Math.exp(-this.orbitSharpness * dt);
      const yawDelta = Math.atan2(
        Math.sin(targetYaw - this.smoothedYaw),
        Math.cos(targetYaw - this.smoothedYaw),
      );
      this.smoothedYaw += yawDelta * orbitAmount;
    }

    this.playerYaw.setFromAxisAngle(this.up, this.smoothedYaw);
    this.desiredPosition.copy(this.offset).applyQuaternion(this.playerYaw).add(playerTransform.position);
    this.desiredTarget.copy(this.lookAtOffset).applyQuaternion(this.playerYaw).add(playerTransform.position);
    const followAmount = this.followSharpness <= 0 ? 1 : 1 - Math.exp(-this.followSharpness * dt);

    for (const [camera, transform] of world.query(CameraComponent, TransformComponent)) {
      if (camera.debugMode) {
        continue;
      }

      transform.position.lerp(this.desiredPosition, followAmount);
      this.orientationCamera.position.copy(transform.position);
      this.orientationCamera.lookAt(this.desiredTarget);
      transform.rotation.setFromQuaternion(this.orientationCamera.quaternion, 'YXZ');
    }
  }
}
