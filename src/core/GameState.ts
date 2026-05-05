import type { TransitionContext } from './TransitionContext';
import type { UpdateEvent } from './UpdateEvent';

export interface GameState {
  enter(context?: TransitionContext): void;
  exit(): void;
  update(updateEvent: UpdateEvent): void;
}
