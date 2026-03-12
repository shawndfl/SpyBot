import type { EventBus } from '../ecs/EventSystem';
import { System } from '../ecs/System';
import type { World } from '../ecs/World';
import { GameInputEvent } from '../events/GameInputEvent';
import { InputManager } from '../input/InputManager';
import { KeyboardAdapter } from '../input/KeyboardAdapter';

export class InputSystem extends System {
  private InputManager: InputManager;
  private keyboardAdapter: KeyboardAdapter;

  constructor() {
    super(0);
    this.InputManager = new InputManager();
    this.keyboardAdapter = new KeyboardAdapter(this.InputManager);
  }

  initialize(): void {}

  resetFrameInputs(): void {
    this.InputManager.resetFrameInputs();
  }

  update(world: World, delta: number, events: EventBus): void {
    this.keyboardAdapter.update();
    events.emit(new GameInputEvent(this.InputManager));
    // Input is handled via event listeners, so we don't need to do anything here.
  }
}
