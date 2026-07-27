import type { ChunkGenerationContext } from './GenerationContext';
import type { ChunkData } from './GenerationTypes';
import type { ProceduralConfig } from './ProceduralConfig';
import { RoadGenerator } from './generators/RoadGenerator';
import { TerrainGenerator } from './generators/TerrainGenerator';
import { SeededRandom } from './random/SeededRandom';

/** Coordinates the ordered procedural stages for a single chunk. */
export class ChunkGenerator {
  readonly terrainGenerator: TerrainGenerator;
  readonly roadGenerator: RoadGenerator;

  constructor(private readonly config: Readonly<ProceduralConfig>) {
    this.terrainGenerator = new TerrainGenerator(config);
    this.roadGenerator = new RoadGenerator(this.terrainGenerator);
  }

  generate(chunkX: number, chunkZ: number): ChunkData {
    const context: ChunkGenerationContext = {
      chunkX,
      chunkZ,
      config: this.config,
      random: new SeededRandom(this.config.seed).fork(`chunk:${chunkX}:${chunkZ}`),
    };

    return {
      chunkX,
      chunkZ,
      terrain: this.terrainGenerator.generate(context),
      roads: this.roadGenerator.generate(context),
    };
  }
}
