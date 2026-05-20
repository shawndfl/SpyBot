import { createRoot, type Root } from 'react-dom/client';

import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { BattleMenuComponent } from '../components/BattleMenuComponent';
import { BattleMenuView } from '../ui/BattleMenuView';

export class BattleMenuSystem extends System {
  private _container: HTMLDivElement;
  private _root: Root;

  constructor(componentMask: number) {
    super(componentMask);

    this._container = document.createElement('div');
    this._container.className = 'battle-menu-root';

    document.body.appendChild(this._container);

    this._root = createRoot(this._container);
  }

  update({ world }: UpdateEvent): void {
    const [result] = world.query(BattleMenuComponent);

    if (!result) {
      this._root.render(null);
      return;
    }

    const [menu] = result;

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
