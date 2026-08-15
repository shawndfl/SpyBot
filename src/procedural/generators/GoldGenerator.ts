import type { ChunkGenerationContext } from '../GenerationContext';
import type { GoldData } from '../GenerationTypes';
import type { TerrainGenerator } from './TerrainGenerator';

/** Generates deterministic gold deposits on the terrain within a chunk. */
export class GoldGenerator {
  constructor(private readonly terrainGenerator: TerrainGenerator) {}

  generate(context: ChunkGenerationContext): GoldData[] {
    const { chunkX, chunkZ, config } = context;
    const random = context.random.fork('gold');
    const originX = chunkX * config.chunkSize;
    const originZ = chunkZ * config.chunkSize;
    const gold: GoldData[] = [];

    for (let index = 0; index < config.goldDepositsPerChunk; index++) {
      const x = originX + random.range(0, config.chunkSize);
      const z = originZ + random.range(0, config.chunkSize);

      gold.push({
        id: `gold_${chunkX}_${chunkZ}_${index}`,
        x,
        y: this.terrainGenerator.getHeight(x, z),
        z,
        amount: Math.floor(random.range(config.goldMinAmount, config.goldMaxAmount + 1)),
      });
    }

    return gold;
  }
}
