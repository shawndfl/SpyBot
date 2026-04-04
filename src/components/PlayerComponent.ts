import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class PlayerComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(PlayerComponent);
  }

  health: number = 100;
}
