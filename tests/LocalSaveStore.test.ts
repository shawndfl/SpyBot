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
    const save = { version: 1 as const, goldBalance: 7, collectedGoldIds: ['gold_0_0_1'] };

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
    });
  });
});
