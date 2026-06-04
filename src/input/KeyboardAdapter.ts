import type { InputManager } from './InputManager';

export class KeyboardAdapter {
  private keys = new Set<string>();
  private keysJustReleased = new Set<string>();

  constructor(private input: InputManager) {
    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => {
      if (this.keys.has(e.key)) {
        this.keysJustReleased.add(e.key);
      }
      this.keys.delete(e.key);
    });
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

    state.menuDownJustReleased = this.justReleased('arrowDown', 'S', 's');
    state.menuUpJustReleased = this.justReleased('arrowUp', 'W', 'w');
    state.menuRightJustReleased = this.justReleased('arrowRight', 'D', 'd');
    state.menuLeftJustReleased = this.justReleased('arrowLeft', 'A', 'a');

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
}
