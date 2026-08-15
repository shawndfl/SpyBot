import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export enum PlayerViewMode {
  ThirdPerson = 'third-person',
  FirstPerson = 'first-person',
  Zoomed = 'zoomed',
}

export class PlayerCameraRigComponent extends Component {
  viewMode = PlayerViewMode.ThirdPerson;
  yaw = 0;
  pitch = -0.15;
  minPitch = -0.8;
  maxPitch = 0.65;
  lookSensitivity = 0.002;
  zoomSensitivityMultiplier = 0.35;
  eyeHeight = 1.65;
  thirdPersonDistance = 5;
  shoulderOffset = 0.75;
  thirdPersonFov = 65;
  firstPersonFov = 65;
  zoomedFov = 35;
  transitionSharpness = 14;

  get mask(): number {
    return ComponentRegistry.getId(PlayerCameraRigComponent);
  }

  constructor(init?: Partial<PlayerCameraRigComponent>) {
    super();
    Object.assign(this, init);
  }
}
