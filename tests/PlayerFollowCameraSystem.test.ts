import * as THREE from 'three';
import { CameraComponent } from '../src/components/CameraComponent';
import { PlayerComponent } from '../src/components/PlayerComponent';
import { TransformComponent } from '../src/components/TransformComponent';
import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import { PlayerFollowCameraSystem } from '../src/systems/PlayerFollowCameraSystem';

describe('PlayerFollowCameraSystem', () => {
  it('orbits with the player and looks ahead in the facing direction', () => {
    vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080 });

    const system = new PlayerFollowCameraSystem({
      offset: new THREE.Vector3(0, 5, 10),
      lookAtOffset: new THREE.Vector3(0, 1, -5),
      followSharpness: 0,
      orbitSharpness: 0,
    });
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
    expect(cameraTransform.position).toEqual(new THREE.Vector3(5, 7, 13));

    playerTransform.position.set(-4, 1, 20);
    playerTransform.rotation.y = Math.PI / 2;
    system.update(updateEvent);

    expect(cameraTransform.position.x).toBeCloseTo(6);
    expect(cameraTransform.position.y).toBeCloseTo(6);
    expect(cameraTransform.position.z).toBeCloseTo(20);
    expect(cameraTransform.rotation.equals(firstRotation)).toBe(false);

    const cameraDirection = new THREE.Vector3(0, 0, -1).applyEuler(cameraTransform.rotation);
    const expectedDirection = new THREE.Vector3(-15, -4, 0).normalize();
    expect(cameraDirection.angleTo(expectedDirection)).toBeCloseTo(0);

    vi.unstubAllGlobals();
  });

  it('smoothly delays the orbit after the player turns', () => {
    vi.stubGlobal('window', { innerWidth: 1920, innerHeight: 1080 });

    const system = new PlayerFollowCameraSystem({
      offset: new THREE.Vector3(0, 5, 10),
      followSharpness: 0,
      orbitSharpness: 2,
    });
    const world = new World([system]);
    const player = world.createEntity();
    const playerTransform = new TransformComponent();
    world.addComponent(player, new PlayerComponent(), playerTransform);

    const cameraEntity = world.createEntity();
    const cameraTransform = new TransformComponent();
    world.addComponent(cameraEntity, new CameraComponent(), cameraTransform);

    const updateEvent = {
      world,
      dt: 0.1,
      events: new EventBus(),
      commands: new CommandBuffer(),
    };

    system.update(updateEvent);
    playerTransform.rotation.y = Math.PI / 2;
    system.update(updateEvent);

    expect(cameraTransform.position.x).toBeGreaterThan(0);
    expect(cameraTransform.position.x).toBeLessThan(10);
    expect(cameraTransform.position.z).toBeGreaterThan(0);

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
