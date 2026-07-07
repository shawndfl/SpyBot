import type RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

export type ColliderShape = 'box' | 'sphere' | 'capsule';

export class ColliderComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(ColliderComponent);
  }

  shape: ColliderShape = 'box';
  size: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  get isSensor(): boolean {
    return false;
  }
  collider?: RAPIER.Collider;

  /**
   * Show a debug box
   */
  debug: boolean = false;
  debugMesh?: THREE.LineSegments;

  constructor(init?: Partial<ColliderComponent>) {
    super();
    Object.assign(this, init);
  }
}
