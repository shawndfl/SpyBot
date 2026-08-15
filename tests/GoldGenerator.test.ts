import { ChunkGenerator } from '../src/procedural/ChunkGenerator';
import { DEFAULT_PROCEDURAL_CONFIG } from '../src/procedural/ProceduralConfig';
import { TerrainGenerator } from '../src/procedural/generators/TerrainGenerator';

describe('GoldGenerator', () => {
  it('generates deterministic terrain-aligned gold deposits', () => {
    const first = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG).generate(-1, 2).gold;
    const second = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG).generate(-1, 2).gold;
    const terrain = new TerrainGenerator(DEFAULT_PROCEDURAL_CONFIG);

    expect(second).toEqual(first);
    expect(first).toHaveLength(DEFAULT_PROCEDURAL_CONFIG.goldDepositsPerChunk);

    for (const deposit of first) {
      expect(deposit.y).toBe(terrain.getHeight(deposit.x, deposit.z));
      expect(deposit.amount).toBeGreaterThanOrEqual(DEFAULT_PROCEDURAL_CONFIG.goldMinAmount);
      expect(deposit.amount).toBeLessThanOrEqual(DEFAULT_PROCEDURAL_CONFIG.goldMaxAmount);
    }
  });

  it('keeps deposits inside their owning chunk', () => {
    const chunk = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG).generate(-2, 3);
    const minX = chunk.chunkX * DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const maxX = minX + DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const minZ = chunk.chunkZ * DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const maxZ = minZ + DEFAULT_PROCEDURAL_CONFIG.chunkSize;

    for (const deposit of chunk.gold) {
      expect(deposit.x).toBeGreaterThanOrEqual(minX);
      expect(deposit.x).toBeLessThan(maxX);
      expect(deposit.z).toBeGreaterThanOrEqual(minZ);
      expect(deposit.z).toBeLessThan(maxZ);
    }
  });
});
