import { Component } from '../ecs/Component';
import { ComponentNames } from '../ecs/ComponentNames';

export class Player extends Component {
  health: number = 100;
  get name(): ComponentNames {
    return ComponentNames.Player;
  }
}
