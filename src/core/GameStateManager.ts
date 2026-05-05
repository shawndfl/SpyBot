import { EmptyGameState } from '../gameStates/EmptyGameState';
import type { GameState } from './GameState';
import type { TransitionContext } from './TransitionContext';
import type { UpdateEvent } from './UpdateEvent';

export class GameStateManager {
  private _stack: GameState[] = [];
  private emptyState = new EmptyGameState();

  push(state: GameState, context?: TransitionContext): void {
    this.current()?.exit();
    this._stack.push(state);
    state.enter(context);
  }

  pop(): void {
    const leaving = this._stack.pop();
    leaving?.exit();

    this.current()?.enter();
  }

  change(state: GameState, context?: TransitionContext): void {
    const leaving = this._stack.pop();
    leaving?.exit();

    this._stack.push(state);
    state.enter(context);
  }

  current(): GameState {
    if (this._stack.length == 0) {
      return this.emptyState;
    }
    return this._stack[this._stack.length - 1];
  }

  update(event: UpdateEvent): void {
    this.current()?.update(event);
  }
}
