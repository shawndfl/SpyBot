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
}

/**
 * Keeps the overworld camera at a fixed three-quarter view while translating
 * it to follow the player. Player rotation never affects the camera angle.
 */
export class PlayerFollowCameraSystem extends System {
  private readonly offset: THREE.Vector3;
  private readonly fixedRotation: THREE.Quaternion;
  private readonly followSharpness: number;
  private readonly desiredPosition = new THREE.Vector3();

  constructor(options: PlayerFollowCameraOptions = {}) {
    super();
    this.offset = options.offset?.clone() ?? new THREE.Vector3(20, 12, 20);
    this.followSharpness = options.followSharpness ?? 8;

    const orientationCamera = new THREE.PerspectiveCamera();
    orientationCamera.position.copy(this.offset);
    orientationCamera.lookAt(options.lookAtOffset?.clone() ?? new THREE.Vector3(0, 1, 0));
    this.fixedRotation = orientationCamera.quaternion.clone();
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

    this.desiredPosition.copy(playerTransform.position).add(this.offset);
    const followAmount = this.followSharpness <= 0 ? 1 : 1 - Math.exp(-this.followSharpness * dt);

    for (const [camera, transform] of world.query(CameraComponent, TransformComponent)) {
      if (camera.debugMode) {
        continue;
      }

      transform.position.lerp(this.desiredPosition, followAmount);
      transform.rotation.setFromQuaternion(this.fixedRotation, 'YXZ');
    }
  }
}
