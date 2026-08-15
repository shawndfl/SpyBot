export interface InputState {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1
  moveZ: number; // -1 to 1

  lookX: number;
  lookY: number;
  aimCycleJustPressed: boolean;

  attackDown: boolean;
  attackJustReleased: boolean;

  openMenuJustReleased: boolean;

  menuDownJustReleased: boolean;
  menuUpJustReleased: boolean;
  menuLeftJustReleased: boolean;
  menuRightJustReleased: boolean;

  selectJustReleased: boolean;
  cancelJustReleased: boolean;

  debugModeToggle: boolean;
}
