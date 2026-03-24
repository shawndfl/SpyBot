import { Object3D } from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class Renderer extends Component {
  public gltfName?: string;

  public mesh: Object3D;

  get mask(): number {
    return ComponentRegistry.getId(Renderer);
  }

  constructor() {
    super();
    this.mesh = new Object3D();
  }

  setGltfName(path: string): Renderer {
    this.gltfName = path;
    return this;
  }
}
