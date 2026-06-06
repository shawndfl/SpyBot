import * as THREE from 'three';

import { CameraAnimationComponent } from '../components/CameraAnimationComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

export class CameraAnimationSystem extends System {
  private readonly targetObject = new THREE.Object3D();

  update({ world, dt }: UpdateEvent): void {
    for (const [transform, cameraAnimation] of world.query(TransformComponent, CameraAnimationComponent)) {
      if (!cameraAnimation.enabled || cameraAnimation.isComplete) {
        continue;
      }

      if (!cameraAnimation.startPosition || !cameraAnimation.startQuaternion) {
        cameraAnimation.startPosition = transform.position.clone();
        cameraAnimation.startQuaternion = new THREE.Quaternion().setFromEuler(transform.rotation);
      }

      const duration = Math.max(cameraAnimation.duration, Number.EPSILON);
      cameraAnimation.elapsed = Math.min(cameraAnimation.elapsed + dt, duration);
      const progress = this.easeInOutCubic(cameraAnimation.elapsed / duration);
      const targetQuaternion = this.getTargetQuaternion(cameraAnimation);

      transform.position.lerpVectors(cameraAnimation.startPosition, cameraAnimation.targetPosition, progress);
      transform.rotation.setFromQuaternion(cameraAnimation.startQuaternion.clone().slerp(targetQuaternion, progress), 'YXZ');

      if (cameraAnimation.elapsed >= duration) {
        transform.position.copy(cameraAnimation.targetPosition);
        transform.rotation.setFromQuaternion(targetQuaternion, 'YXZ');
        cameraAnimation.isComplete = true;
        cameraAnimation.enabled = false;
      }
    }
  }

  private getTargetQuaternion(cameraAnimation: CameraAnimationComponent): THREE.Quaternion {
    const direction = cameraAnimation.targetDirection.clone();

    if (direction.lengthSq() === 0) {
      direction.set(0, 0, -1);
    }

    this.targetObject.position.copy(cameraAnimation.targetPosition);
    this.targetObject.up.set(0, 1, 0);
    this.targetObject.lookAt(cameraAnimation.targetPosition.clone().add(direction.normalize()));

    return this.targetObject.quaternion.clone();
  }

  private easeInOutCubic(value: number): number {
    return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }
}
