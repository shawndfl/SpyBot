import { SoundIds } from '../src/audio/SoundIds';
import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import { PlaySoundEvent } from '../src/events/PlaySoundEvent';
import { AudioSystem } from '../src/systems/AudioSystem';

describe('AudioSystem', () => {
  it('forwards play-sound events to the audio service', () => {
    const play = vi.fn(() => true);
    const system = new AudioSystem({ play });
    const world = new World([system]);
    const events = new EventBus();
    events.emit(new PlaySoundEvent(SoundIds.goldCollect, { volume: 0.6, playbackRate: 1.1 }));

    system.update({
      world,
      dt: 1 / 60,
      events,
      commands: new CommandBuffer(),
    });

    expect(play).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledWith(SoundIds.goldCollect, { volume: 0.6, playbackRate: 1.1 });
  });
});
