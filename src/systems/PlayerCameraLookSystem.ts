import * as THREE from 'three';
import { CameraComponent } from '../components/CameraComponent';
import { PlayerCameraRigComponent, PlayerViewMode } from '../components/PlayerCameraRigComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { GameInputEvent } from '../events/GameInputEvent';

/**
 * Updates camera intent independently from camera placement and rendering.
 */
export class PlayerCameraLookSystem extends System {
  update({ world, events }: UpdateEvent): void {
    const [inputEvent] = events.get(GameInputEvent);
    if (!inputEvent) {
      return;
    }

    for (const [camera, rig] of world.query(CameraComponent, PlayerCameraRigComponent)) {
      if (camera.debugMode) {
        continue;
      }

      if (inputEvent.payload.state.aimCycleJustPressed) {
        rig.viewMode = this.nextViewMode(rig.viewMode);
      }

      const sensitivity =
        rig.lookSensitivity * (rig.viewMode === PlayerViewMode.Zoomed ? rig.zoomSensitivityMultiplier : 1);
      rig.yaw -= inputEvent.payload.state.lookX * sensitivity;
      rig.pitch -= inputEvent.payload.state.lookY * sensitivity;
      rig.pitch = THREE.MathUtils.clamp(rig.pitch, rig.minPitch, rig.maxPitch);
    }
  }

  private nextViewMode(mode: PlayerViewMode): PlayerViewMode {
    switch (mode) {
      case PlayerViewMode.ThirdPerson:
        return PlayerViewMode.FirstPerson;
      case PlayerViewMode.FirstPerson:
        return PlayerViewMode.Zoomed;
      case PlayerViewMode.Zoomed:
        return PlayerViewMode.ThirdPerson;
    }
  }
}
