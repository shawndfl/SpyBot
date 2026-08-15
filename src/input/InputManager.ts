import type { InputState } from './InputState';

export class InputManager {
  public state: InputState = {
    moveX: 0,
    moveY: 0,

    moveZ: 0,
    lookX: 0,
    lookY: 0,
    aimCycleJustPressed: false,
    attackDown: false,
    attackJustReleased: false,
    openMenuJustReleased: false,

    menuDownJustReleased: false,
    menuUpJustReleased: false,
    menuLeftJustReleased: false,
    menuRightJustReleased: false,

    selectJustReleased: false,
    cancelJustReleased: false,

    debugModeToggle: false,
  };

  resetFrameInputs() {
    this.state.lookX = 0;
    this.state.lookY = 0;
    this.state.aimCycleJustPressed = false;
    this.state.attackJustReleased = false;
    this.state.openMenuJustReleased = false;

    this.state.cancelJustReleased = false;
    this.state.selectJustReleased = false;

    this.state.menuDownJustReleased = false;
    this.state.menuUpJustReleased = false;
    this.state.menuLeftJustReleased = false;
    this.state.menuRightJustReleased = false;

    this.state.debugModeToggle = false;
  }
}
