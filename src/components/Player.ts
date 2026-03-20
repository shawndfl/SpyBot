import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class Player extends Component {
  get mask(): number {
    return ComponentRegistry.getId(Player);
  }

  health: number = 100;
}
