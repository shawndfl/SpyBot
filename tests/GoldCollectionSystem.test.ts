import * as THREE from 'three';
import { GoldCollectibleComponent } from '../src/components/GoldCollectibleComponent';
import { PlayerComponent } from '../src/components/PlayerComponent';
import { TransformComponent } from '../src/components/TransformComponent';
import { CommandBuffer } from '../src/ecs/CommandBuffer';
import { EventBus } from '../src/ecs/EventBus';
import { World } from '../src/ecs/World';
import type { GameSaveData, SaveStore } from '../src/persistence/LocalSaveStore';
import { PlayerProgressResource } from '../src/procedural/resources/PlayerProgressResource';
import { GoldCollectionSystem } from '../src/systems/GoldCollectionSystem';
import { PlaySoundEvent } from '../src/events/PlaySoundEvent';
import { SoundIds } from '../src/audio/SoundIds';

class MemorySaveStore implements SaveStore {
  data: GameSaveData = { version: 1, goldBalance: 0, collectedGoldIds: [] };
  saveCount = 0;

  load(): GameSaveData {
    return { ...this.data, collectedGoldIds: [...this.data.collectedGoldIds] };
  }

  save(data: GameSaveData): void {
    this.data = { ...data, collectedGoldIds: [...data.collectedGoldIds] };
    this.saveCount++;
  }
}

describe('GoldCollectionSystem', () => {
  it('collects and persists a nearby deposit only once', () => {
    const system = new GoldCollectionSystem();
    const world = new World([system]);
    const saveStore = new MemorySaveStore();
    const progress = new PlayerProgressResource(saveStore);
    world.resources.addResource(progress);

    const player = world.createEntity();
    world.addComponent(player, new PlayerComponent(), new TransformComponent());

    const gold = world.createEntity();
    world.addComponent(
      gold,
      new GoldCollectibleComponent({ goldId: 'gold_v1_0_0_0', amount: 3 }),
      new TransformComponent({ position: new THREE.Vector3(0.5, 0, 0) }),
    );

    const updateEvent = {
      world,
      dt: 1 / 60,
      events: new EventBus(),
      commands: new CommandBuffer(),
    };

    system.update(updateEvent);
    system.update(updateEvent);

    expect(progress.goldBalance).toBe(3);
    expect(progress.collectedGoldIds.has('gold_v1_0_0_0')).toBe(true);
    expect(saveStore.saveCount).toBe(1);
    expect(saveStore.data.collectedGoldIds).toEqual(['gold_v1_0_0_0']);
    expect(updateEvent.events.get(PlaySoundEvent)).toHaveLength(1);
    expect(updateEvent.events.get(PlaySoundEvent)[0].soundId).toBe(SoundIds.goldCollect);
  });
});
