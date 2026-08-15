import type { UpdateEvent } from '../core/UpdateEvent';

import { System } from '../ecs/System';

import { GameInputEvent } from '../events/GameInputEvent';
import { InputManager } from '../input/InputManager';
import { KeyboardAdapter } from '../input/KeyboardAdapter';
import { MouseAdapter } from '../input/MouseAdapter';

export class InputSystem extends System {
  private InputManager: InputManager;
  private keyboardAdapter: KeyboardAdapter;
  private mouseAdapter?: MouseAdapter;
  private gameInputEvent: GameInputEvent;

  constructor(pointerLockElement?: HTMLElement) {
    super();
    this.InputManager = new InputManager();
    this.keyboardAdapter = new KeyboardAdapter(this.InputManager);
    if (pointerLockElement) {
      this.mouseAdapter = new MouseAdapter(this.InputManager, pointerLockElement);
    }
    this.gameInputEvent = new GameInputEvent(this.InputManager);
  }

  resetFrameInputs(): void {
    this.InputManager.resetFrameInputs();
  }

  dispose(): void {
    this.keyboardAdapter.dispose();
    this.mouseAdapter?.dispose();
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    this.keyboardAdapter.update();
    this.mouseAdapter?.update();
    events.emit(this.gameInputEvent);
    // Input is handled via event listeners, so we don't need to do anything here.
  }
}
