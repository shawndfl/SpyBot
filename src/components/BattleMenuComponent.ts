import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export type BattleMenuOption = 'attack' | 'special' | 'item';

export class BattleMenuComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(BattleMenuComponent);
  }

  visible = true;

  selectedIndex = 0;

  options: BattleMenuOption[] = ['attack', 'special', 'item'];

  onSelect?: (option: BattleMenuOption) => void;
}
