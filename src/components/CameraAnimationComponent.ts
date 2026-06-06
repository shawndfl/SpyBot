import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class CameraAnimationComponent extends Component {
  targetPosition: THREE.Vector3 = new THREE.Vector3();
  targetDirection: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  duration: number = 1.5;
  elapsed: number = 0;
  enabled: boolean = true;
  isComplete: boolean = false;

  startPosition?: THREE.Vector3;
  startQuaternion?: THREE.Quaternion;

  get mask(): number {
    return ComponentRegistry.getId(CameraAnimationComponent);
  }

  constructor(init?: Partial<CameraAnimationComponent>) {
    super();
    Object.assign(this, init);
  }

  setTarget(targetPosition: THREE.Vector3, targetDirection: THREE.Vector3): CameraAnimationComponent {
    this.targetPosition.copy(targetPosition);
    this.targetDirection.copy(targetDirection);
    this.restart();
    return this;
  }

  restart(): CameraAnimationComponent {
    this.elapsed = 0;
    this.enabled = true;
    this.isComplete = false;
    this.startPosition = undefined;
    this.startQuaternion = undefined;
    return this;
  }
}
