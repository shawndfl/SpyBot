import type { InputManager } from './InputManager';

/** Converts pointer-lock mouse input into device-independent gameplay intent. */
export class MouseAdapter {
  private lookX = 0;
  private lookY = 0;
  private attackDown = false;
  private aimCycleJustPressed = false;

  constructor(
    private readonly input: InputManager,
    private readonly element: HTMLElement,
  ) {
    this.element.addEventListener('click', this.onClick);
    this.element.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  update(): void {
    const state = this.input.state;
    state.lookX = this.lookX;
    state.lookY = this.lookY;
    state.attackDown = state.attackDown || this.attackDown;
    state.aimCycleJustPressed = this.aimCycleJustPressed;

    this.lookX = 0;
    this.lookY = 0;
    this.aimCycleJustPressed = false;
  }

  dispose(): void {
    this.element.removeEventListener('click', this.onClick);
    this.element.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    if (document.pointerLockElement === this.element) {
      document.exitPointerLock();
    }
  }

  private readonly onClick = (): void => {
    if (document.pointerLockElement !== this.element) {
      void this.element.requestPointerLock();
    }
  };

  private readonly onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.element) {
      return;
    }

    this.lookX += event.movementX;
    this.lookY += event.movementY;
  };

  private readonly onMouseDown = (event: MouseEvent): void => {
    if (document.pointerLockElement !== this.element) {
      return;
    }

    if (event.button === 0) {
      this.attackDown = true;
    } else if (event.button === 2) {
      this.aimCycleJustPressed = true;
    }
  };

  private readonly onMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) {
      this.attackDown = false;
    }
  };
}
