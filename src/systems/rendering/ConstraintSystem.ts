import * as THREE from 'three';
import { ConstraintComponent, DistanceState } from '../../components/ConstraintComponent';
import { TransformComponent } from '../../components/TransformComponent';
import type { UpdateEvent } from '../../core/UpdateEvent';
import { System } from '../../ecs/System';

export class ConstraintSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    for (let [constraint, transform] of world.query(ConstraintComponent, TransformComponent)) {
      if (!constraint.target || !constraint.source || !constraint.enabled) {
        return;
      }

      if (constraint.state == DistanceState.near) {
        this.nearMoveUpdate(constraint, dt);
      } else {
        this.farMoveUpdate(constraint, dt);
      }
    }
  }
  /**
   * This function will move the object close to the target
   * @param constraint
   * @param dt
   * @returns
   */
  private farMoveUpdate(constraint: ConstraintComponent, dt: number): void {
    const target = constraint.target!;
    const source = constraint.source!;

    const targetPosition = target.position.clone();
    const correctedOffset = constraint.targetOffset.clone();
    correctedOffset.x = 0;
    correctedOffset.z = 0;
    correctedOffset.applyEuler(constraint.target!.rotation);
    targetPosition.add(correctedOffset);

    const toTarget = targetPosition.sub(constraint.source!.position);
    const distance = toTarget.length();
    toTarget.normalize();

    // update the state
    if (distance < constraint.innerDistance) {
      constraint.state = DistanceState.near;
    }

    const lookAt = toTarget.clone().negate();

    const yaw = Math.atan2(lookAt.x, lookAt.z);
    const pitch = Math.asin(-lookAt.y);

    const newPitch = this.moveAngleTowards(source.rotation.x, pitch, dt * constraint.pitchSpeed);
    const newYaw = this.moveAngleTowards(source.rotation.y, yaw, dt * constraint.yawSpeed);

    constraint.source!.rotation.set(newPitch, newYaw, 0, 'YXZ');

    // 10 cm a second
    const step = toTarget.multiplyScalar(constraint.FarMovementSpeed * dt);
    source.position.add(step);
  }

  private nearMoveUpdate(constraint: ConstraintComponent, dt: number): void {
    const target = constraint.target!;
    const source = constraint.source!;
    const targetPosition = target.position.clone();

    // the target offset rotated around the target
    const correctedOffset = constraint.targetOffset.clone();
    correctedOffset.applyEuler(target.rotation);

    // change the target to include the offset
    const offsetTarget = targetPosition.clone().add(correctedOffset);
    const toOffsetTarget = offsetTarget.clone().sub(source.position);
    const distanceToOffsetTarget = toOffsetTarget.length();
    toOffsetTarget.normalize();

    // the target lookat which the source needs to rotate to once it is near
    const targetLookAt = targetPosition.clone().sub(source.position).negate();
    const distance = targetLookAt.length();
    targetLookAt.normalize();

    const yaw = Math.atan2(targetLookAt.x, targetLookAt.z);
    const pitch = Math.asin(-targetLookAt.y);

    const newPitch = this.moveAngleTowards(source.rotation.x, pitch, dt * constraint.pitchSpeed);
    const newYaw = this.moveAngleTowards(source.rotation.y, yaw, dt * constraint.yawSpeed);

    source.rotation.set(newPitch, newYaw, 0, 'YXZ');

    // with in a mm just set the position
    if (distanceToOffsetTarget < 0.001) {
      source.position.copy(offsetTarget);
    } else {
      // 10 cm a second
      const scale = Math.min(distanceToOffsetTarget, constraint.closeMovementSpeed * dt);
      const step = toOffsetTarget.multiplyScalar(scale);
      source.position.add(step);
    }

    // update state
    if (distance > constraint.outerDistance) {
      constraint.state = DistanceState.far;
    }
  }

  private wrapAngle(angle: number): number {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  private moveAngleTowards(current: number, target: number, maxStep: number): number {
    const delta = this.wrapAngle(target - current);

    if (Math.abs(delta) <= maxStep) {
      return target;
    }

    return current + Math.sign(delta) * maxStep;
  }
}
