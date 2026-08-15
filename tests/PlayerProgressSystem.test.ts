import * as THREE from 'three';
import { PlayerComponent } from '../src/components/PlayerComponent';
import { TransformComponent } from '../src/components/TransformComponent';
import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import type { GameSaveData, SaveStore } from '../src/persistence/LocalSaveStore';
import { PlayerProgressResource } from '../src/procedural/resources/PlayerProgressResource';
import { PlayerProgressSystem } from '../src/systems/PlayerProgressSystem';

class MemorySaveStore implements SaveStore {
  data: GameSaveData = {
    version: 1,
    goldBalance: 0,
    collectedGoldIds: [],
    playerPosition: { x: 5, y: 0, z: 3 },
  };
  saveCount = 0;

  load(): GameSaveData {
    return structuredClone(this.data);
  }

  save(data: GameSaveData): void {
    this.data = structuredClone(data);
    this.saveCount++;
  }
}

describe('PlayerProgressSystem', () => {
  it('tracks position immediately and persists moved positions at its interval', () => {
    const system = new PlayerProgressSystem(1);
    const world = new World([system]);
    const saveStore = new MemorySaveStore();
    const progress = new PlayerProgressResource(saveStore);
    world.resources.addResource(progress);

    const player = world.createEntity();
    const transform = new TransformComponent({ position: new THREE.Vector3(8, 2, -4) });
    world.addComponent(player, new PlayerComponent(), transform);

    const updateEvent = {
      world,
      dt: 0.5,
      events: new EventBus(),
      commands: new CommandBuffer(),
    };

    system.update(updateEvent);
    expect(progress.playerPosition).toEqual(new THREE.Vector3(8, 2, -4));
    expect(saveStore.saveCount).toBe(0);

    system.update(updateEvent);
    expect(saveStore.saveCount).toBe(1);
    expect(saveStore.data.playerPosition).toEqual({ x: 8, y: 2, z: -4 });
  });
});
