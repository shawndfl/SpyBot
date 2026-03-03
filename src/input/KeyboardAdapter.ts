import type { InputManager } from './InputManager';

export class KeyboardAdapter {
  private keys = new Set<string>();

  constructor(private input: InputManager) {
    window.addEventListener('keydown', (e) => this.keys.add(e.key));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
  }

  update() {
    const state = this.input.state;

    state.moveX = (this.keys.has('d') ? 1 : 0) - (this.keys.has('a') ? 1 : 0);

    state.moveY = (this.keys.has('w') ? 1 : 0) - (this.keys.has('s') ? 1 : 0);

    state.attack = this.keys.has(' ');
    state.openMenu = this.keys.has('Escape');
    state.select = this.keys.has('Enter');
  }
}
