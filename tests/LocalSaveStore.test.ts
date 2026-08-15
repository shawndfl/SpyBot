import { LocalSaveStore, type KeyValueStorage } from '../src/persistence/LocalSaveStore';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('LocalSaveStore', () => {
  it('round-trips valid save data', () => {
    const store = new LocalSaveStore(new MemoryStorage());
    const save = {
      version: 1 as const,
      goldBalance: 7,
      collectedGoldIds: ['gold_0_0_1'],
      playerPosition: { x: 12, y: 1.5, z: -8 },
    };

    store.save(save);

    expect(store.load()).toEqual(save);
  });

  it('returns a safe default for corrupt data', () => {
    const storage = new MemoryStorage();
    storage.setItem(LocalSaveStore.storageKey, '{broken');

    expect(new LocalSaveStore(storage).load()).toEqual({
      version: 1,
      goldBalance: 0,
      collectedGoldIds: [],
      playerPosition: { x: 5, y: 0, z: 3 },
    });
  });

  it('loads an existing version-one save without a position at the default spawn', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LocalSaveStore.storageKey,
      JSON.stringify({ version: 1, goldBalance: 4, collectedGoldIds: ['gold_v1_0_0_0'] }),
    );

    expect(new LocalSaveStore(storage).load()).toEqual({
      version: 1,
      goldBalance: 4,
      collectedGoldIds: ['gold_v1_0_0_0'],
      playerPosition: { x: 5, y: 0, z: 3 },
    });
  });
});
