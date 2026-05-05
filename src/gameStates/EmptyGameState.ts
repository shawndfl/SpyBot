import type { GameState } from '../core/GameState';
import type { TransitionContext } from '../core/TransitionContext';
import type { UpdateEvent } from '../core/UpdateEvent';

/**
 * Does nothing
 */
export class EmptyGameState implements GameState {
  enter(context?: TransitionContext): void {}
  exit(): void {}
  update(event: UpdateEvent): void {}
}
