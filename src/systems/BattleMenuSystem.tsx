import { createRoot, type Root } from 'react-dom/client';

import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { BattleMenuComponent } from '../components/BattleMenuComponent';
import { BattleMenuView } from '../ui/BattleMenuView';
import { GameInputEvent } from '../events/GameInputEvent';

export class BattleMenuSystem extends System {
  private _container: HTMLDivElement;
  private _root: Root;

  constructor() {
    super();

    this._container = document.createElement('div');
    this._container.className = 'battle-menu-root';

    document.body.appendChild(this._container);

    this._root = createRoot(this._container);
  }

  update({ world, events }: UpdateEvent): void {
    const [result] = world.query(BattleMenuComponent);

    if (!result) {
      this._root.render(null);
      return;
    }

    const [menu] = result;
    const [input] = events.get(GameInputEvent);

    if (input.payload.state.menuDownJustReleased) {
      menu.selectedIndex = (menu.selectedIndex + 1) % menu.options.length;
    } else if (input.payload.state.menuUpJustReleased) {
      menu.selectedIndex = (menu.selectedIndex - 1) % menu.options.length;
      if (menu.selectedIndex < 0) {
        menu.selectedIndex = menu.options.length - 1;
      }
    } else if (input.payload.state.menuDownJustReleased) {
      const option = menu.options[menu.selectedIndex];
      if (menu.onSelect) {
        menu.onSelect(option);
      }
    }
    this._root.render(
      <BattleMenuView
        visible={menu.visible}
        options={menu.options}
        selectedIndex={menu.selectedIndex}
        onHover={(index) => {
          menu.selectedIndex = index;
        }}
        onSelect={(option) => {
          menu.onSelect?.(option);
        }}
      />
    );
  }
}
