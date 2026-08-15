import { Resource } from '../../ecs/Resource';
import type { GameSaveData, SaveStore } from '../../persistence/LocalSaveStore';

/**
 * Resource to store player's progress
 */
export class PlayerProgressResource extends Resource {
  goldBalance: number;
  readonly collectedGoldIds: Set<string>;

  constructor(private readonly saveStore: SaveStore) {
    super();
    const save = saveStore.load();
    this.goldBalance = save.goldBalance;
    this.collectedGoldIds = new Set(save.collectedGoldIds);
  }

  collectGold(goldId: string, amount: number): boolean {
    if (this.collectedGoldIds.has(goldId)) {
      return false;
    }

    this.collectedGoldIds.add(goldId);
    this.goldBalance += amount;
    this.saveStore.save(this.toSaveData());
    return true;
  }

  private toSaveData(): GameSaveData {
    return {
      version: 1,
      goldBalance: this.goldBalance,
      collectedGoldIds: [...this.collectedGoldIds].sort(),
    };
  }
}
