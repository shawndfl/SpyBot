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
  it('generates a chunk at the configured size and sample spacing', () => {
    const generator = new TerrainGenerator(DEFAULT_PROCEDURAL_CONFIG);
    const terrain = generator.generate(createContext(0, 0));
    const verticesPerSide = DEFAULT_PROCEDURAL_CONFIG.chunkSize / DEFAULT_PROCEDURAL_CONFIG.sampleSpacing + 1;

    expect(terrain.chunkSize).toBe(DEFAULT_PROCEDURAL_CONFIG.chunkSize);
    expect(terrain.verticesPerSide).toBe(verticesPerSide);
    expect(terrain.heights).toHaveLength(verticesPerSide * verticesPerSide);
    expect(terrain.normals).toHaveLength(verticesPerSide * verticesPerSide * 3);
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
