import type { InputManager } from '../input/InputManager';
import { GameEvent } from './GameEvent';
import { GameEventNames } from './GameEventNames';

/**
 * Passes input data from the InputSystem to any systems that need it.
 * This decouples input handling from specific systems, allowing for more flexible and modular code.
 */
export class GameInputEvent extends GameEvent {
  public get payload(): InputManager {
    return this._payload;
  }
  constructor(private readonly _payload: InputManager) {
    super(GameEventNames.InputEvent);
  }
}
