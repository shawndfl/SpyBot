import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

export class MeshGlbComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(MeshGlbComponent);
  }

  filename: string = '';

  constructor(init?: Partial<MeshGlbComponent>) {
    super();
    Object.assign(this, init);
  }
}
