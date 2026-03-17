import { Component } from '../ecs/Component';
import { ComponentMask } from '../ecs/ComponentNames';

export class Player extends Component {
  health: number = 100;
  get mask(): ComponentMask {
    return ComponentMask.Player;
  }
}
