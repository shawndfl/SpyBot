import { ChunkGenerator } from '../src/procedural/ChunkGenerator';
import { DEFAULT_PROCEDURAL_CONFIG } from '../src/procedural/ProceduralConfig';

describe('PlotGenerator', () => {
  it('generates deterministic plots on both sides of a road', () => {
    const first = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG).generate(0, 0).plots;
    const second = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG).generate(0, 0).plots;

    expect(second).toEqual(first);
    expect(first.some((plot) => plot.side === 'left')).toBe(true);
    expect(first.some((plot) => plot.side === 'right')).toBe(true);
  });

  it('keeps every plot corner inside its owning chunk', () => {
    const chunk = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG).generate(-2, 3);
    const minX = chunk.chunkX * DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const maxX = minX + DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const minZ = chunk.chunkZ * DEFAULT_PROCEDURAL_CONFIG.chunkSize;
    const maxZ = minZ + DEFAULT_PROCEDURAL_CONFIG.chunkSize;

    for (const plot of chunk.plots) {
      const tangentX = Math.cos(plot.rotationY);
      const tangentZ = -Math.sin(plot.rotationY);
      const normalX = -tangentZ;
      const normalZ = tangentX;

      for (const along of [-1, 1]) {
        for (const across of [-1, 1]) {
          const x = plot.centerX + tangentX * plot.width * 0.5 * along + normalX * plot.depth * 0.5 * across;
          const z = plot.centerZ + tangentZ * plot.width * 0.5 * along + normalZ * plot.depth * 0.5 * across;
          expect(x).toBeGreaterThanOrEqual(minX);
          expect(x).toBeLessThanOrEqual(maxX);
          expect(z).toBeGreaterThanOrEqual(minZ);
          expect(z).toBeLessThanOrEqual(maxZ);
        }
      }
    }
  });
});
