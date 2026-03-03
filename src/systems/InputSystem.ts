import type { Engine } from '../ecs/Engine';
import { System } from '../ecs/System';
import { InputManager } from '../input/InputManager';
import { KeyboardAdapter } from '../input/KeyboardAdapter';

export class InputSystem extends System {
  private InputManager: InputManager;
  private keyboardAdapter: KeyboardAdapter;

  constructor() {
    super();
    this.InputManager = new InputManager();
    this.keyboardAdapter = new KeyboardAdapter(this.InputManager);
  }

  initialize(): void {}

  resetFrameInputs(): void {
    this.InputManager.resetFrameInputs();
  }

  update(engine: Engine, delta: number): void {
    this.keyboardAdapter.update();
    // Input is handled via event listeners, so we don't need to do anything here.
  }
}
