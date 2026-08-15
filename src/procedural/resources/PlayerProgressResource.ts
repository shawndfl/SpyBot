import { Resource } from '../../ecs/Resource';
import type { GameSaveData, SaveStore } from '../../persistence/LocalSaveStore';
import * as THREE from 'three';

/**
 * Resource to store player's progress
 */
export class PlayerProgressResource extends Resource {
  goldBalance: number;
  readonly collectedGoldIds: Set<string>;
  readonly playerPosition: THREE.Vector3;

  constructor(private readonly saveStore: SaveStore) {
    super();
    const save = saveStore.load();
    this.goldBalance = save.goldBalance;
    this.collectedGoldIds = new Set(save.collectedGoldIds);
    this.playerPosition = new THREE.Vector3(save.playerPosition.x, save.playerPosition.y, save.playerPosition.z);
  }

  collectGold(goldId: string, amount: number): boolean {
    if (this.collectedGoldIds.has(goldId)) {
      return false;
    }

    this.collectedGoldIds.add(goldId);
    this.goldBalance += amount;
    this.save();
    return true;
  }

  updatePlayerPosition(position: THREE.Vector3Like): void {
    this.playerPosition.set(position.x, position.y, position.z);
  }

  save(): void {
    this.saveStore.save(this.toSaveData());
  }

  private toSaveData(): GameSaveData {
    return {
      version: 1,
      goldBalance: this.goldBalance,
      collectedGoldIds: [...this.collectedGoldIds].sort(),
      playerPosition: {
        x: this.playerPosition.x,
        y: this.playerPosition.y,
        z: this.playerPosition.z,
      },
    };
  }
}
