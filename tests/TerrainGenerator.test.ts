import { DEFAULT_PROCEDURAL_TERRAIN_CONFIG } from '../src/procedural/ProceduralConfig';
import { TerrainGenerator } from '../src/procedural/generators/TerrainGenerator';

describe('TerrainGenerator', () => {
  it('generates a 64-unit chunk at the configured sample spacing', () => {
    const generator = new TerrainGenerator(DEFAULT_PROCEDURAL_TERRAIN_CONFIG);
    const terrain = generator.generate({
      chunkX: 0,
      chunkZ: 0,
      config: DEFAULT_PROCEDURAL_TERRAIN_CONFIG,
    });

    expect(terrain.chunkSize).toBe(64);
    expect(terrain.verticesPerSide).toBe(33);
    expect(terrain.heights).toHaveLength(33 * 33);
    expect(terrain.normals).toHaveLength(33 * 33 * 3);
  });

  it('matches height samples across neighboring chunk boundaries', () => {
    const generator = new TerrainGenerator(DEFAULT_PROCEDURAL_TERRAIN_CONFIG);
    const left = generator.generate({ chunkX: -1, chunkZ: 0, config: DEFAULT_PROCEDURAL_TERRAIN_CONFIG });
    const right = generator.generate({ chunkX: 0, chunkZ: 0, config: DEFAULT_PROCEDURAL_TERRAIN_CONFIG });

    for (let z = 0; z < left.verticesPerSide; z++) {
      const leftHeight = left.heights[z * left.verticesPerSide + left.verticesPerSide - 1];
      const rightHeight = right.heights[z * right.verticesPerSide];
      expect(leftHeight).toBe(rightHeight);
    }
  });

  it('is deterministic for a seed and changes with a different seed', () => {
    const first = new TerrainGenerator(DEFAULT_PROCEDURAL_TERRAIN_CONFIG);
    const second = new TerrainGenerator(DEFAULT_PROCEDURAL_TERRAIN_CONFIG);
    const different = new TerrainGenerator({ ...DEFAULT_PROCEDURAL_TERRAIN_CONFIG, seed: 42 });

    const firstHeight = first.getHeight(12, -8);
    expect(second.getHeight(12, -8)).toBe(firstHeight);
    expect(different.getHeight(12, -8)).not.toBe(firstHeight);
  });
});
