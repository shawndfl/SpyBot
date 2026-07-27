import type { ProceduralConfig } from './ProceduralConfig';
import type { SeededRandom } from './random/SeededRandom';

export interface ChunkGenerationContext {
  chunkX: number;
  chunkZ: number;
  config: Readonly<ProceduralConfig>;
  random: SeededRandom;
}
