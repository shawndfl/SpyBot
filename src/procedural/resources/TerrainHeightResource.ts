import { Resource } from '../../ecs/Resource';
import type { ChunkGenerator } from '../ChunkGenerator';

/** Shared access to the procedural terrain's canonical height function. */
export class TerrainHeightResource extends Resource {
  constructor(private readonly generator: ChunkGenerator) {
    super();
  }

  getHeight(worldX: number, worldZ: number): number {
    return this.generator.terrainGenerator.getHeight(worldX, worldZ);
  }
}
