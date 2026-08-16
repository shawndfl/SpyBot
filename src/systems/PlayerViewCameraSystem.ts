import * as THREE from 'three';
import { CameraComponent } from '../components/CameraComponent';
import { PlayerCameraRigComponent, PlayerViewMode } from '../components/PlayerCameraRigComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

/** Places the camera from the shared rig state for all player view modes. */
export class PlayerViewCameraSystem extends System {
  private readonly focus = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly desiredPosition = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();
  private readonly orientationCamera = new THREE.PerspectiveCamera();
  private readonly rotation = new THREE.Euler(0, 0, 0, 'YXZ');

  update({ world, dt }: UpdateEvent): void {
    const playerResult = world.query(PlayerComponent, TransformComponent).next();
    if (playerResult.done) {
      return;
    }
    const [, playerTransform] = playerResult.value;

    for (const [camera, rig, cameraTransform] of world.query(
      CameraComponent,
      PlayerCameraRigComponent,
      TransformComponent,
    )) {
      playerTransform.root.visible = camera.debugMode || rig.viewMode === PlayerViewMode.ThirdPerson;
      if (camera.debugMode) {
        continue;
      }

      this.rotation.set(rig.pitch, rig.yaw, 0, 'YXZ');
      this.forward.set(0, 0, -1).applyEuler(this.rotation).normalize();
      this.right.set(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rig.yaw);
      this.focus.copy(playerTransform.position).addScaledVector(THREE.Object3D.DEFAULT_UP, rig.eyeHeight);

      this.desiredPosition.copy(this.focus);
      if (rig.viewMode === PlayerViewMode.ThirdPerson) {
        this.desiredPosition.addScaledVector(this.forward, -rig.thirdPersonDistance);
        this.desiredPosition.addScaledVector(this.right, rig.shoulderOffset);
      }

      const transitionAmount = rig.transitionSharpness <= 0 ? 1 : 1 - Math.exp(-rig.transitionSharpness * dt);
      cameraTransform.position.lerp(this.desiredPosition, transitionAmount);
      this.lookTarget.copy(this.focus).addScaledVector(this.forward, 100);
      this.orientationCamera.position.copy(cameraTransform.position);
      this.orientationCamera.lookAt(this.lookTarget);
      cameraTransform.rotation.setFromQuaternion(this.orientationCamera.quaternion, 'YXZ');

      const desiredFov = this.getDesiredFov(rig);
      camera.camera.fov = THREE.MathUtils.lerp(camera.camera.fov, desiredFov, transitionAmount);
      camera.camera.updateProjectionMatrix();
    }
  }

  private getDesiredFov(rig: PlayerCameraRigComponent): number {
    switch (rig.viewMode) {
      case PlayerViewMode.ThirdPerson:
        return rig.thirdPersonFov;
      case PlayerViewMode.FirstPerson:
        return rig.firstPersonFov;
      case PlayerViewMode.Zoomed:
        return rig.zoomedFov;
    }
  }
}
