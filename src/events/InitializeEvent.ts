import { GameEvent } from './GameEvent';
import { GameEventNames } from './GameEventNames';

export class InitializeEvent extends GameEvent {
  constructor() {
    super(GameEventNames.InitializeLevel);
  }
}
