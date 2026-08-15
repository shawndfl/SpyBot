import * as THREE from 'three';
import { CameraComponent } from '../src/components/CameraComponent';
import { PlayerCameraRigComponent, PlayerViewMode } from '../src/components/PlayerCameraRigComponent';
import { PlayerComponent } from '../src/components/PlayerComponent';
import { TransformComponent } from '../src/components/TransformComponent';
import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import { PlayerViewCameraSystem } from '../src/systems/PlayerViewCameraSystem';

describe('PlayerViewCameraSystem', () => {
  beforeEach(() => vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080 }));
  afterEach(() => vi.unstubAllGlobals());

  it('places the camera over the shoulder and moves it to the player eye position', () => {
    const system = new PlayerViewCameraSystem();
    const world = new World([system]);
    const player = world.createEntity();
    world.addComponent(
      player,
      new PlayerComponent(),
      new TransformComponent({ position: new THREE.Vector3(4, 2, 8) }),
    );

    const cameraEntity = world.createEntity();
    const camera = new CameraComponent();
    const rig = new PlayerCameraRigComponent({ pitch: 0, transitionSharpness: 0 });
    const transform = new TransformComponent();
    world.addComponent(cameraEntity, camera, rig, transform);
    const updateEvent = { world, dt: 1 / 60, events: new EventBus(), commands: new CommandBuffer() };

    system.update(updateEvent);
    expect(transform.position).toEqual(new THREE.Vector3(4.75, 3.65, 13));
    expect(camera.camera.fov).toBe(65);

    rig.viewMode = PlayerViewMode.FirstPerson;
    system.update(updateEvent);
    expect(transform.position).toEqual(new THREE.Vector3(4, 3.65, 8));

    rig.viewMode = PlayerViewMode.Zoomed;
    system.update(updateEvent);
    expect(camera.camera.fov).toBe(35);
  });
});
