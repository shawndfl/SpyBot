export interface InputState {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1

  attackDown: boolean;
  attackJustReleased: boolean;

  openMenuJustReleased: boolean;
  selectJustReleased: boolean;
}
