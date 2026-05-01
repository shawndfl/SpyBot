import { CameraComponent } from '../components/CameraComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

export class CameraSyncSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    for (let [cameraComponent, transform] of world.query(CameraComponent, TransformComponent)) {
      if (cameraComponent.useOrbit) {
        continue;
      }

      cameraComponent.camera.position.copy(transform.position);
      cameraComponent.camera.rotation.copy(transform.rotation);
      cameraComponent.camera.scale.copy(transform.scale);
    }
  }
}
