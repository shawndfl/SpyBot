import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class Renderer extends Component {
  get mask(): number {
    return ComponentRegistry.getId(Renderer);
  }

  setGltfName(path: string): Renderer {
    this.gltfName = path;
    return this;
  }

  public gltfName?: string;
}
