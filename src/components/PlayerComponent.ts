import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class PlayerComponent extends Component {
  speed: number = 5.5;
  rotationSpeed: number = 2.5;

  get mask(): number {
    return ComponentRegistry.getId(PlayerComponent);
  }

  health: number = 100;

  constructor(init?: Partial<PlayerComponent>) {
    super();
    Object.assign(this, init);
  }
}
