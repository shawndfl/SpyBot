import * as THREE from 'three';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

export class LightComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(LightComponent);
  }
  constructor(public light: THREE.Light) {
    super();
  }

  dispose(): void {
    if (this.light) {
      this.light.parent?.remove(this.light);
    }
  }
}
