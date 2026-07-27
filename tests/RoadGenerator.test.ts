import { ChunkGenerator } from '../src/procedural/ChunkGenerator';
import { DEFAULT_PROCEDURAL_CONFIG } from '../src/procedural/ProceduralConfig';

describe('RoadGenerator', () => {
  it('connects neighboring chunks at the same boundary point', () => {
    const generator = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG);
    const leftRoad = generator.generate(-1, 2).roads[0];
    const rightRoad = generator.generate(0, 2).roads[0];
    const leftExit = leftRoad.points.at(-1)!;
    const rightEntrance = rightRoad.points[0];

    expect(leftExit).toEqual(rightEntrance);
  });

  it('keeps road points within the chunk except on its boundary', () => {
    const generator = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG);
    const chunk = generator.generate(-2, -3);
    const minX = chunk.chunkX * DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const maxX = minX + DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const minZ = chunk.chunkZ * DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const maxZ = minZ + DEFAULT_PROCEDURAL_CONFIG.chunkSize;

    for (const point of chunk.roads[0].points) {
      expect(point.x).toBeGreaterThanOrEqual(minX);
      expect(point.x).toBeLessThanOrEqual(maxX);
      expect(point.z).toBeGreaterThanOrEqual(minZ);
      expect(point.z).toBeLessThanOrEqual(maxZ);
    }
  });

  it('is deterministic and responds to seed changes', () => {
    const first = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG).generate(1, 1).roads;
    const second = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG).generate(1, 1).roads;
    const different = new ChunkGenerator({ ...DEFAULT_PROCEDURAL_CONFIG, seed: 99 }).generate(1, 1).roads;

    expect(second).toEqual(first);
    expect(different).not.toEqual(first);
  });
});
