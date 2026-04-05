import * as THREE from 'three';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

/**
 * This component gets added by RenderInitSystem
 */
export class RendererComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(RendererComponent);
  }

  constructor(public mesh: THREE.Mesh) {
    super();
  }

  destroy(): void {
    if (this.mesh) {
      this.mesh.parent?.remove(this.mesh);
    }
  }
}
