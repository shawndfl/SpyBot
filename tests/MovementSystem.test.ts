import * as THREE from 'three';
import { AnimationComponent } from '../src/components/AnimationComponent';
import { PlayerCameraRigComponent } from '../src/components/PlayerCameraRigComponent';
import { PlayerComponent } from '../src/components/PlayerComponent';
import { RigidBodyComponent } from '../src/components/physics/RigidBodyComponent';
import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import { GameInputEvent } from '../src/events/GameInputEvent';
import { InputManager } from '../src/input/InputManager';
import { MovementSystem } from '../src/systems/MovementSystem';

describe('MovementSystem', () => {
  function createHarness(yaw: number) {
    const system = new MovementSystem();
    const world = new World([system]);
    const playerEntity = world.createEntity();
    const rigid = new RigidBodyComponent();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    let nextPosition = new THREE.Vector3();
    let nextRotation = new THREE.Quaternion();
    rigid.body = {
      translation: () => position,
      rotation: () => rotation,
      setNextKinematicTranslation: (value: THREE.Vector3) => nextPosition.copy(value),
      setNextKinematicRotation: (value: THREE.Quaternion) => nextRotation.copy(value),
    } as never;
    const animation = new AnimationComponent();
    const playAnimation = vi.spyOn(animation, 'play');
    world.addComponent(playerEntity, new PlayerComponent({ speed: 5 }), animation, rigid);

    const rigEntity = world.createEntity();
    world.addComponent(rigEntity, new PlayerCameraRigComponent({ yaw }));

    const input = new InputManager();
    const events = new EventBus();
    events.emit(new GameInputEvent(input));
    return {
      input,
      update: () => system.update({ world, dt: 1, events, commands: new CommandBuffer() }),
      nextPosition: () => nextPosition,
      nextRotation: () => nextRotation,
      playAnimation,
    };
  }

  it('strafes relative to the mouse-controlled player yaw', () => {
    const harness = createHarness(Math.PI / 2);
    harness.input.state.moveX = 1;
    harness.update();

    expect(harness.nextPosition().x).toBeCloseTo(0);
    expect(harness.nextPosition().z).toBeCloseTo(-5);
    const expectedRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    expect(harness.nextRotation().angleTo(expectedRotation)).toBeCloseTo(0);
    expect(harness.playAnimation).toHaveBeenCalledWith('Strafe_left');
  });

  it('uses the left strafe animation while moving left', () => {
    const harness = createHarness(0);
    harness.input.state.moveX = -1;
    harness.update();

    expect(harness.playAnimation).toHaveBeenCalledWith('Strafe_right');
  });

  it('normalizes diagonal movement to the configured player speed', () => {
    const harness = createHarness(0);
    harness.input.state.moveX = 1;
    harness.input.state.moveY = 1;
    harness.update();

    expect(harness.nextPosition().length()).toBeCloseTo(5);
    expect(harness.playAnimation).toHaveBeenCalledWith('Strafe_left');
  });
});
