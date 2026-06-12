import type { UpdateEvent } from '../core/UpdateEvent';

import { System } from '../ecs/System';

import { GameInputEvent } from '../events/GameInputEvent';
import { InputManager } from '../input/InputManager';
import { KeyboardAdapter } from '../input/KeyboardAdapter';

export class InputSystem extends System {
  private InputManager: InputManager;
  private keyboardAdapter: KeyboardAdapter;
  private gameInputEvent: GameInputEvent;

  constructor() {
    super();
    this.InputManager = new InputManager();
    this.keyboardAdapter = new KeyboardAdapter(this.InputManager);
    this.gameInputEvent = new GameInputEvent(this.InputManager);
  }

  resetFrameInputs(): void {
    this.InputManager.resetFrameInputs();
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    this.keyboardAdapter.update();
    events.emit(this.gameInputEvent);
    // Input is handled via event listeners, so we don't need to do anything here.
  }
}
