export interface GameSaveData {
  version: 1;
  goldBalance: number;
  collectedGoldIds: string[];
  playerPosition: SavedVector3;
}

export interface SavedVector3 {
  x: number;
  y: number;
  z: number;
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
  playerPosition: { x: 5, y: 0, z: 3 },
};

export class LocalSaveStore implements SaveStore {
  static readonly storageKey = 'spyhero.save.v1';

  constructor(private readonly storage: KeyValueStorage) {}

  load(): GameSaveData {
    const serialized = this.storage.getItem(LocalSaveStore.storageKey);
    if (!serialized) {
      return this.createDefaultSaveData();
    }

    try {
      const value: unknown = JSON.parse(serialized);
      if (!this.isGameSaveData(value)) {
        return this.createDefaultSaveData();
      }
      return {
        version: 1,
        goldBalance: value.goldBalance,
        collectedGoldIds: [...new Set(value.collectedGoldIds)],
        playerPosition: this.isSavedVector3(value.playerPosition)
          ? { ...value.playerPosition }
          : { ...DEFAULT_SAVE_DATA.playerPosition },
      };
    } catch {
      return this.createDefaultSaveData();
    }
  }

  save(data: GameSaveData): void {
    this.storage.setItem(LocalSaveStore.storageKey, JSON.stringify(data));
  }

  private isGameSaveData(value: unknown): value is Omit<GameSaveData, 'playerPosition'> & {
    playerPosition?: SavedVector3;
  } {
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

  private isSavedVector3(value: unknown): value is SavedVector3 {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const vector = value as Partial<SavedVector3>;
    return [vector.x, vector.y, vector.z].every((coordinate) =>
      typeof coordinate === 'number' && Number.isFinite(coordinate),
    );
  }

  private createDefaultSaveData(): GameSaveData {
    return {
      ...DEFAULT_SAVE_DATA,
      collectedGoldIds: [],
      playerPosition: { ...DEFAULT_SAVE_DATA.playerPosition },
    };
  }
}
