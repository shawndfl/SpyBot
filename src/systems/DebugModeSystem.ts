import * as THREE from 'three';
import { System } from '../ecs/System';
import type { UpdateEvent } from '../core/UpdateEvent';
import { CameraComponent } from '../components/CameraComponent';
import { ConstraintComponent } from '../components/ConstraintComponent';
import { GameInputEvent } from '../events/GameInputEvent';
import { TransformComponent } from '../components/TransformComponent';
import type { InputState } from '../input/InputState';

export class DebugModeSystem extends System {
  private readonly movementSpeed = 12;
  private readonly lookSensitivity = 0.002;
  private readonly mouseDelta = new THREE.Vector2();
  private readonly moveDirection = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private yaw = 0;
  private pitch = 0;
  private mouseDown = false;

  initialize(): void {
    window.addEventListener('mousemove', (event) => {
      if (!this.mouseDown) {
        return;
      }

      this.mouseDelta.x += event.movementX;
      this.mouseDelta.y += event.movementY;
    });

    window.addEventListener('mousedown', () => {
      this.mouseDown = true;
    });

    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
  }

  update({ world, dt, events }: UpdateEvent): void {
    const [inputEvents] = events.get(GameInputEvent);
    const inputState = inputEvents?.payload.state;

    for (let [entity, cameraComponent, transform] of world.queryWithEntity(
      CameraComponent,
      TransformComponent
    )) {
      if (inputState?.debugModeToggle) {
        cameraComponent.debugMode = !cameraComponent.debugMode;

        if (cameraComponent.debugMode) {
          this.yaw = cameraComponent.camera.rotation.y;
          this.pitch = cameraComponent.camera.rotation.x;
        }
      }

      const constraint = world.getComponent(entity, ConstraintComponent);
      if (constraint) {
        constraint.enabled = !cameraComponent.debugMode;
      }

      if (cameraComponent.debugMode && inputState) {
        this.updateFreeCamera(cameraComponent, transform, inputState, dt);
      }
    }

    this.mouseDelta.set(0, 0);
  }

  private updateFreeCamera(
    cameraComponent: CameraComponent,
    transform: TransformComponent,
    inputState: InputState,
    dt: number
  ): void {
    const camera = cameraComponent.camera;

    this.yaw -= this.mouseDelta.x * this.lookSensitivity;
    this.pitch -= this.mouseDelta.y * this.lookSensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);

    camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    this.forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    this.right.set(1, 0, 0).applyQuaternion(camera.quaternion);

    this.moveDirection.set(0, 0, 0);
    this.moveDirection.addScaledVector(this.forward, inputState.moveY);
    this.moveDirection.addScaledVector(this.right, inputState.moveX);
    this.moveDirection.addScaledVector(this.up, inputState.moveZ);

    if (this.moveDirection.lengthSq() > 0) {
      this.moveDirection.normalize().multiplyScalar(this.movementSpeed * dt);
      camera.position.add(this.moveDirection);
    }

    transform.position.copy(camera.position);
    transform.rotation.copy(camera.rotation);
    transform.scale.copy(camera.scale);
  }
}
