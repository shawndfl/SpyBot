import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';
import type { KinematicCharacterController } from '@dimforge/rapier3d-compat';

export type RigidBodyType = 'dynamic' | 'fixed' | 'kinematic';

export class RigidBodyComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(RigidBodyComponent);
  }

  initialPosition?: THREE.Vector3;
  initialRotation?: THREE.Quaternion;
  useTerrainHeight?: boolean;

  type: RigidBodyType = 'dynamic';
  body?: RAPIER.RigidBody;

  requestPlayerController?: boolean;

  /**
   * The player controller. This will be created by PhysicsSystem if
   * requestPlayerController is set to true.
   */
  playerController?: KinematicCharacterController;

  constructor(init?: Partial<RigidBodyComponent>) {
    super();

    Object.assign(this, init);
  }
}
