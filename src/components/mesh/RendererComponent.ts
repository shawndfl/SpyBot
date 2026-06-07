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

  private _rootTransform?: THREE.Object3D;

  get isReady(): boolean {
    return !!this._rootTransform;
  }

  constructor(_ready: Promise<THREE.Object3D | undefined>) {
    super();

    _ready.then((rootTransform) => {
      this._rootTransform = rootTransform;
    });
  }

  destroy(): void {
    if (this._rootTransform) {
      this._rootTransform.parent?.remove(this._rootTransform);
    }
  }
}
