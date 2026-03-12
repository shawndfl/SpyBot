import { Component } from '../ecs/Component';
import { ComponentNames } from '../ecs/ComponentNames';

export class Renderer extends Component {
  get name(): ComponentNames {
    return ComponentNames.Renderer;
  }

  public gltfName?: string;
}
