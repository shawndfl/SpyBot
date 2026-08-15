import type { InputManager } from './InputManager';

export class KeyboardAdapter {
  private keys = new Set<string>();
  private keysJustReleased = new Set<string>();

  constructor(private input: InputManager) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  update() {
    const state = this.input.state;

    state.moveX =
      (this.keys.has('d') || this.keys.has('D') ? 1 : 0) - (this.keys.has('a') || this.keys.has('A') ? 1 : 0);

    state.moveY =
      (this.keys.has('w') || this.keys.has('W') ? 1 : 0) - (this.keys.has('s') || this.keys.has('S') ? 1 : 0);

    state.moveZ =
      (this.keys.has('e') || this.keys.has('E') ? 1 : 0) - (this.keys.has('x') || this.keys.has('X') ? 1 : 0);

    state.attackDown = this.keys.has(' ');
    state.attackJustReleased = this.keysJustReleased.has(' ');
    state.openMenuJustReleased = this.keysJustReleased.has('Escape');
    state.selectJustReleased = this.keysJustReleased.has('Enter');

    state.menuDownJustReleased = this.justReleased('ArrowDown', 'S', 's');
    state.menuUpJustReleased = this.justReleased('ArrowUp', 'W', 'w');
    state.menuRightJustReleased = this.justReleased('ArrowRight', 'D', 'd');
    state.menuLeftJustReleased = this.justReleased('ArrowLeft', 'A', 'a');

    state.debugModeToggle = this.justReleased('B', 'b');

    state.cancelJustReleased = this.keysJustReleased.has('Delete');

    // reset the just released set
    this.keysJustReleased.clear();
  }

  justReleased(...keys: string[]): boolean {
    if (!keys) {
      false;
    }

    return keys.some((key) => this.keysJustReleased.has(key));
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.key);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (this.keys.has(event.key)) {
      this.keysJustReleased.add(event.key);
    }
    this.keys.delete(event.key);
  };
}
