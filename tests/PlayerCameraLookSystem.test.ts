import { CameraComponent } from '../src/components/CameraComponent';
import { PlayerCameraRigComponent, PlayerViewMode } from '../src/components/PlayerCameraRigComponent';
import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import { GameInputEvent } from '../src/events/GameInputEvent';
import { InputManager } from '../src/input/InputManager';
import { PlayerCameraLookSystem } from '../src/systems/PlayerCameraLookSystem';

describe('PlayerCameraLookSystem', () => {
  beforeEach(() => vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080 }));
  afterEach(() => vi.unstubAllGlobals());

  function createHarness() {
    const system = new PlayerCameraLookSystem();
    const world = new World([system]);
    const cameraEntity = world.createEntity();
    const rig = new PlayerCameraRigComponent();
    world.addComponent(cameraEntity, new CameraComponent(), rig);
    const input = new InputManager();
    const events = new EventBus();
    events.emit(new GameInputEvent(input));
    return {
      rig,
      input,
      update: () => system.update({ world, dt: 1 / 60, events, commands: new CommandBuffer() }),
    };
  }

  it('cycles through third-person, first-person, zoomed, and back', () => {
    const { rig, input, update } = createHarness();

    for (const expected of [PlayerViewMode.FirstPerson, PlayerViewMode.Zoomed, PlayerViewMode.ThirdPerson]) {
      input.state.aimCycleJustPressed = true;
      update();
      expect(rig.viewMode).toBe(expected);
    }
  });

  it('clamps pitch and reduces look sensitivity while zoomed', () => {
    const normal = createHarness();
    normal.input.state.lookX = 10;
    normal.input.state.lookY = 10000;
    normal.update();

    expect(normal.rig.yaw).toBeCloseTo(-0.02);
    expect(normal.rig.pitch).toBe(normal.rig.minPitch);

    const zoomed = createHarness();
    zoomed.rig.viewMode = PlayerViewMode.Zoomed;
    zoomed.input.state.lookX = 10;
    zoomed.update();

    expect(zoomed.rig.yaw).toBeCloseTo(-0.007);
  });
});
