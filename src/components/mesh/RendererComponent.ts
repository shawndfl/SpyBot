import * as THREE from 'three';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

/**
 * This component gets added by RenderInitSystem. Other systems down
 * stream can traverse the root transform and build behaviors from it.
 * Keep in mind the root transform is not ready until the whole model is loaded
 */
export class RendererComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(RendererComponent);
  }

  constructor(private _rootTransform: THREE.Object3D | undefined) {
    super();
  }

  destroy(): void {
    if (this._rootTransform) {
      this._rootTransform.parent?.remove(this._rootTransform);
    }
  }
}
