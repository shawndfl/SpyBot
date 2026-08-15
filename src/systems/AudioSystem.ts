import type { AudioPlayback } from '../audio/AudioManager';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { PlaySoundEvent } from '../events/PlaySoundEvent';

export class AudioSystem extends System {
  constructor(private readonly audio: AudioPlayback) {
    super();
  }

  update({ events }: UpdateEvent): void {
    for (const event of events.get(PlaySoundEvent)) {
      this.audio.play(event.soundId, event.options);
    }
  }
}
