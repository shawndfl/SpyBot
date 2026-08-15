export interface GameSaveData {
  version: 1;
  goldBalance: number;
  collectedGoldIds: string[];
}

export interface SaveStore {
  load(): GameSaveData;
  save(data: GameSaveData): void;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const DEFAULT_SAVE_DATA: GameSaveData = {
  version: 1,
  goldBalance: 0,
  collectedGoldIds: [],
};

export class LocalSaveStore implements SaveStore {
  static readonly storageKey = 'spyhero.save.v1';

  constructor(private readonly storage: KeyValueStorage) {}

  load(): GameSaveData {
    const serialized = this.storage.getItem(LocalSaveStore.storageKey);
    if (!serialized) {
      return { ...DEFAULT_SAVE_DATA, collectedGoldIds: [] };
    }

    try {
      const value: unknown = JSON.parse(serialized);
      if (!this.isGameSaveData(value)) {
        return { ...DEFAULT_SAVE_DATA, collectedGoldIds: [] };
      }
      return {
        version: 1,
        goldBalance: value.goldBalance,
        collectedGoldIds: [...new Set(value.collectedGoldIds)],
      };
    } catch {
      return { ...DEFAULT_SAVE_DATA, collectedGoldIds: [] };
    }
  }

  save(data: GameSaveData): void {
    this.storage.setItem(LocalSaveStore.storageKey, JSON.stringify(data));
  }

  private isGameSaveData(value: unknown): value is GameSaveData {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Partial<GameSaveData>;
    return (
      candidate.version === 1 &&
      Number.isSafeInteger(candidate.goldBalance) &&
      candidate.goldBalance! >= 0 &&
      Array.isArray(candidate.collectedGoldIds) &&
      candidate.collectedGoldIds.every((id) => typeof id === 'string')
    );
  }
}
