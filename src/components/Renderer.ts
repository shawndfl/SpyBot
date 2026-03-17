import { Component } from '../ecs/Component';
import { ComponentMask } from '../ecs/ComponentNames';

export class Renderer extends Component {
  get mask(): ComponentMask {
    return ComponentMask.Renderer;
  }

  setGltfName(path: string): Renderer {
    this.gltfName = path;
    return this;
  }

  public gltfName?: string;
}
