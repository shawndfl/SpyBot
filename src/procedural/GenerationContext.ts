import type { ProceduralTerrainConfig } from './ProceduralConfig';

export interface TerrainGenerationContext {
  chunkX: number;
  chunkZ: number;
  config: Readonly<ProceduralTerrainConfig>;
}
