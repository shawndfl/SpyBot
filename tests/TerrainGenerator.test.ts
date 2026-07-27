import { DEFAULT_PROCEDURAL_CONFIG } from '../src/procedural/ProceduralConfig';
import { TerrainGenerator } from '../src/procedural/generators/TerrainGenerator';
import { SeededRandom } from '../src/procedural/random/SeededRandom';

const createContext = (chunkX: number, chunkZ: number) => ({
  chunkX,
  chunkZ,
  config: DEFAULT_PROCEDURAL_CONFIG,
  random: new SeededRandom(DEFAULT_PROCEDURAL_CONFIG.seed).fork(`chunk:${chunkX}:${chunkZ}`),
});

describe('TerrainGenerator', () => {
  it('generates a 64-unit chunk at the configured sample spacing', () => {
    const generator = new TerrainGenerator(DEFAULT_PROCEDURAL_CONFIG);
    const terrain = generator.generate(createContext(0, 0));

    expect(terrain.chunkSize).toBe(64);
    expect(terrain.verticesPerSide).toBe(33);
    expect(terrain.heights).toHaveLength(33 * 33);
    expect(terrain.normals).toHaveLength(33 * 33 * 3);
  });

  it('matches height samples across neighboring chunk boundaries', () => {
    const generator = new TerrainGenerator(DEFAULT_PROCEDURAL_CONFIG);
    const left = generator.generate(createContext(-1, 0));
    const right = generator.generate(createContext(0, 0));

    for (let z = 0; z < left.verticesPerSide; z++) {
      const leftHeight = left.heights[z * left.verticesPerSide + left.verticesPerSide - 1];
      const rightHeight = right.heights[z * right.verticesPerSide];
      expect(leftHeight).toBe(rightHeight);
    }
  });

  it('is deterministic for a seed and changes with a different seed', () => {
    const first = new TerrainGenerator(DEFAULT_PROCEDURAL_CONFIG);
    const second = new TerrainGenerator(DEFAULT_PROCEDURAL_CONFIG);
    const different = new TerrainGenerator({ ...DEFAULT_PROCEDURAL_CONFIG, seed: 42 });

    const firstHeight = first.getHeight(12, -8);
    expect(second.getHeight(12, -8)).toBe(firstHeight);
    expect(different.getHeight(12, -8)).not.toBe(firstHeight);
  });
});
