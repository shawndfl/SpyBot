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
      (this.keys.has('d') || this.keys.has('D') ? 1 : 0) - (this.keys.has('a') || this.keys.has('a') ? 1 : 0);

    state.moveY =
      (this.keys.has('w') || this.keys.has('D') ? 1 : 0) - (this.keys.has('s') || this.keys.has('S') ? 1 : 0);

    state.attackDown = this.keys.has(' ');
    state.attackJustReleased = this.keysJustReleased.has(' ');
    state.openMenuJustReleased = this.keysJustReleased.has('Escape');
    state.selectJustReleased = this.keysJustReleased.has('Enter');

    // reset the just released set
    this.keysJustReleased.clear();
  }
}
