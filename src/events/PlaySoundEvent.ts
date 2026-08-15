import type { PlaySoundOptions } from '../audio/AudioManager';
import type { SoundId } from '../audio/SoundIds';
import { GameEvent } from './GameEvent';
import { GameEventNames } from './GameEventNames';

export class PlaySoundEvent extends GameEvent {
  get type(): string {
    return GameEventNames.PlaySoundEvent;
  }

  constructor(
    readonly soundId: SoundId,
    readonly options: PlaySoundOptions = {},
  ) {
    super();
  }
}
