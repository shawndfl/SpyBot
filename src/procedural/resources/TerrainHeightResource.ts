import { Resource } from '../../ecs/Resource';
import type { TerrainGenerator } from '../generators/TerrainGenerator';

/** Shared access to the procedural terrain's canonical height function. */
export class TerrainHeightResource extends Resource {
  constructor(private readonly generator: TerrainGenerator) {
    super();
  }

  getHeight(worldX: number, worldZ: number): number {
    return this.generator.getHeight(worldX, worldZ);
  }
}
