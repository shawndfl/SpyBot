import type { InputState } from './InputState';

export class InputManager {
  public state: InputState = {
    moveX: 0,
    moveY: 0,
    attack: false,
    openMenu: false,
    select: false,
  };

  resetFrameInputs() {
    this.state.attack = false;
    this.state.openMenu = false;
    this.state.select = false;
  }
}
