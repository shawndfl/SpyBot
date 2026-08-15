import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import { GameInputEvent } from '../src/events/GameInputEvent';
import { PlaySoundEvent } from '../src/events/PlaySoundEvent';
import { InputManager } from '../src/input/InputManager';
import { SoundIds } from '../src/audio/SoundIds';
import { PlayerFootstepSystem } from '../src/systems/PlayerFootstepSystem';

describe('PlayerFootstepSystem', () => {
  it('plays footsteps at a cadence while the player translates', () => {
    const system = new PlayerFootstepSystem({ stepInterval: 0.4 });
    const world = new World([system]);
    const events = new EventBus();
    const input = new InputManager();
    input.state.moveY = 1;
    events.emit(new GameInputEvent(input));

    const updateEvent = {
      world,
      dt: 0.1,
      events,
      commands: new CommandBuffer(),
    };

    system.update(updateEvent);
    system.update(updateEvent);
    system.update(updateEvent);
    system.update(updateEvent);
    system.update(updateEvent);

    const footsteps = events.get(PlaySoundEvent);
    expect(footsteps).toHaveLength(2);
    expect(footsteps.every((event) => event.soundId === SoundIds.footstepsGrass)).toBe(true);
    expect(footsteps.map((event) => event.options.playbackRate)).toEqual([0.97, 1.03]);
  });

  it('does not play footsteps while turning without translating', () => {
    const system = new PlayerFootstepSystem();
    const world = new World([system]);
    const events = new EventBus();
    const input = new InputManager();
    input.state.moveX = 1;
    events.emit(new GameInputEvent(input));

    system.update({
      world,
      dt: 1,
      events,
      commands: new CommandBuffer(),
    });

    expect(events.get(PlaySoundEvent)).toHaveLength(0);
  });
});
