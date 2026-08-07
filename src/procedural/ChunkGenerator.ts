import type { ChunkGenerationContext } from './GenerationContext';
import type { ChunkData } from './GenerationTypes';
import type { ProceduralConfig } from './ProceduralConfig';
import { RoadGenerator } from './generators/RoadGenerator';
import { PlotGenerator } from './generators/PlotGenerator';
import { TerrainGenerator } from './generators/TerrainGenerator';
import { SeededRandom } from './random/SeededRandom';

/** Coordinates the ordered procedural stages for a single chunk. */
export class ChunkGenerator {
  readonly terrainGenerator: TerrainGenerator;
  readonly roadGenerator: RoadGenerator;
  readonly plotGenerator: PlotGenerator;

  constructor(private readonly config: Readonly<ProceduralConfig>) {
    this.terrainGenerator = new TerrainGenerator(config);
    this.roadGenerator = new RoadGenerator(this.terrainGenerator);
    this.plotGenerator = new PlotGenerator(this.terrainGenerator);
  }

  generate(chunkX: number, chunkZ: number): ChunkData {
    const context: ChunkGenerationContext = {
      chunkX,
      chunkZ,
      config: this.config,
      random: new SeededRandom(this.config.seed).fork(`chunk:${chunkX}:${chunkZ}`),
    };

    const terrain = this.terrainGenerator.generate(context);
    const roads = this.roadGenerator.generate(context);

    return {
      chunkX,
      chunkZ,
      terrain,
      roads,
      plots: this.plotGenerator.generate(context, roads),
    };
  }
}
