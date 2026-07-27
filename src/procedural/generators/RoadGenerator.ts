import type { ChunkGenerationContext } from '../GenerationContext';
import type { RoadData, RoadPoint } from '../GenerationTypes';
import { SeededRandom } from '../random/SeededRandom';
import type { TerrainGenerator } from './TerrainGenerator';

/** Generates one deterministic east-west road with shared chunk endpoints. */
export class RoadGenerator {
  constructor(private readonly terrainGenerator: TerrainGenerator) {}

  generate(context: ChunkGenerationContext): RoadData[] {
    const { chunkX, chunkZ, config } = context;
    const originX = chunkX * config.chunkSize;
    const originZ = chunkZ * config.chunkSize;
    const edgeMargin = Math.max(config.roadWidth, config.chunkSize * 0.2);
    const previousZ = originZ + this.getBoundaryOffset(context, chunkX - 1, edgeMargin);
    const westZ = originZ + this.getBoundaryOffset(context, chunkX, edgeMargin);
    const eastZ = originZ + this.getBoundaryOffset(context, chunkX + 1, edgeMargin);
    const nextZ = originZ + this.getBoundaryOffset(context, chunkX + 2, edgeMargin);
    const points: RoadPoint[] = [];

    for (let sample = 0; sample <= config.roadSamples; sample++) {
      const t = sample / config.roadSamples;
      const x = originX + config.chunkSize * t;
      const z = this.catmullRom(previousZ, westZ, eastZ, nextZ, t);
      points.push({
        x,
        y: this.terrainGenerator.getHeight(x, z),
        z,
        tangentX: config.chunkSize,
        tangentZ: this.catmullRomDerivative(previousZ, westZ, eastZ, nextZ, t),
      });
    }

    return [{ id: `road_${chunkX}_${chunkZ}`, width: config.roadWidth, points }];
  }

  private getBoundaryOffset(context: ChunkGenerationContext, boundaryX: number, margin: number): number {
    return new SeededRandom(context.config.seed)
      .fork(`road-boundary:${boundaryX}:${context.chunkZ}`)
      .range(margin, context.config.chunkSize - margin);
  }

  private catmullRom(previous: number, start: number, end: number, next: number, t: number): number {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * start +
        (-previous + end) * t +
        (2 * previous - 5 * start + 4 * end - next) * t2 +
        (-previous + 3 * start - 3 * end + next) * t3)
    );
  }

  private catmullRomDerivative(previous: number, start: number, end: number, next: number, t: number): number {
    if (t === 0) {
      return 0.5 * (end - previous);
    }
    if (t === 1) {
      return 0.5 * (next - start);
    }

    const t2 = t * t;
    return (
      0.5 *
      (-previous +
        end +
        2 * (2 * previous - 5 * start + 4 * end - next) * t +
        3 * (-previous + 3 * start - 3 * end + next) * t2)
    );
  }
}
