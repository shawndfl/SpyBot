import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';
import type { TransformComponent } from './TransformComponent';

export enum DistanceState {
  far,
  near,
  watchful,
}

export class ConstraintComponent extends Component {
  targetOffset: THREE.Vector3 = new THREE.Vector3();

  closeMovementSpeed: number = 4.0; // meters/second
  FarMovementSpeed: number = 7; // meters/second

  yawSpeed: number = 7.5;
  pitchSpeed: number = 5.5;

  target?: TransformComponent;
  source?: TransformComponent;
  enabled: boolean = true;

  /**
   * Limits in meters that trigger state changes
   */
  innerDistance: number = 3;
  /**
   * When in the near state how far does the target need to be before switching to the
   * far state
   */
  outerDistance: number = 5;

  state?: DistanceState;

  get mask(): number {
    return ComponentRegistry.getId(ConstraintComponent);
  }
}
