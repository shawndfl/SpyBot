import * as THREE from 'three';
import { CameraComponent } from '../src/components/CameraComponent';
import { PlayerComponent } from '../src/components/PlayerComponent';
import { TransformComponent } from '../src/components/TransformComponent';
import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import { PlayerFollowCameraSystem } from '../src/systems/PlayerFollowCameraSystem';

describe('PlayerFollowCameraSystem', () => {
  it('moves with the player while preserving a fixed three-quarter rotation', () => {
    vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080 });

    const system = new PlayerFollowCameraSystem({ followSharpness: 0 });
    const world = new World([system]);
    const player = world.createEntity();
    const playerTransform = new TransformComponent({ position: new THREE.Vector3(5, 2, 3) });
    world.addComponent(player, new PlayerComponent(), playerTransform);

    const cameraEntity = world.createEntity();
    const camera = new CameraComponent();
    const cameraTransform = new TransformComponent();
    world.addComponent(cameraEntity, camera, cameraTransform);

    const updateEvent = {
      world,
      dt: 1 / 60,
      events: new EventBus(),
      commands: new CommandBuffer(),
    };

    system.update(updateEvent);
    const firstRotation = cameraTransform.rotation.clone();
    expect(cameraTransform.position).toEqual(new THREE.Vector3(15, 14, 13));

    playerTransform.position.set(-4, 1, 20);
    playerTransform.rotation.y = Math.PI;
    system.update(updateEvent);

    expect(cameraTransform.position).toEqual(new THREE.Vector3(6, 13, 30));
    expect(cameraTransform.rotation.equals(firstRotation)).toBe(true);

    vi.unstubAllGlobals();
  });

  it('does not override the free camera in debug mode', () => {
    vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080 });

    const system = new PlayerFollowCameraSystem({ followSharpness: 0 });
    const world = new World([system]);
    const player = world.createEntity();
    world.addComponent(player, new PlayerComponent(), new TransformComponent());

    const cameraEntity = world.createEntity();
    const camera = new CameraComponent({ debugMode: true });
    const cameraTransform = new TransformComponent({ position: new THREE.Vector3(1, 2, 3) });
    world.addComponent(cameraEntity, camera, cameraTransform);

    system.update({
      world,
      dt: 1 / 60,
      events: new EventBus(),
      commands: new CommandBuffer(),
    });

    expect(cameraTransform.position).toEqual(new THREE.Vector3(1, 2, 3));
    vi.unstubAllGlobals();
  });
});
