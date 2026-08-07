import type { ChunkGenerationContext } from '../GenerationContext';
import type { PlotData, RoadData, RoadPoint } from '../GenerationTypes';
import type { TerrainGenerator } from './TerrainGenerator';

/** Generates deterministic rectangular building plots beside generated roads. */
export class PlotGenerator {
  constructor(private readonly terrainGenerator: TerrainGenerator) {}

  generate(context: ChunkGenerationContext, roads: RoadData[]): PlotData[] {
    const plots: PlotData[] = [];

    for (const road of roads) {
      for (let plotIndex = 0; plotIndex < context.config.plotsPerRoadSide; plotIndex++) {
        const fraction = (plotIndex + 1) / (context.config.plotsPerRoadSide + 1);
        const pointIndex = Math.round(fraction * (road.points.length - 1));
        const roadPoint = road.points[pointIndex];

        for (const side of [-1, 1] as const) {
          const plot = this.createPlot(context, road, roadPoint, plotIndex, side);
          if (this.isInsideChunk(context, plot, roadPoint)) {
            plots.push(plot);
          }
        }
      }
    }

    return plots;
  }

  private createPlot(
    context: ChunkGenerationContext,
    road: RoadData,
    roadPoint: RoadPoint,
    plotIndex: number,
    side: -1 | 1,
  ): PlotData {
    const tangentLength = Math.hypot(roadPoint.tangentX, roadPoint.tangentZ);
    const tangentX = roadPoint.tangentX / tangentLength;
    const tangentZ = roadPoint.tangentZ / tangentLength;
    const normalX = -tangentZ * side;
    const normalZ = tangentX * side;
    const offset = road.width * 0.5 + context.config.plotRoadSetback + context.config.plotDepth * 0.5;
    const centerX = roadPoint.x + normalX * offset;
    const centerZ = roadPoint.z + normalZ * offset;
    const sideName = side === 1 ? 'left' : 'right';

    return {
      id: `plot_${context.chunkX}_${context.chunkZ}_${plotIndex}_${sideName}`,
      roadId: road.id,
      centerX,
      centerY: this.terrainGenerator.getHeight(centerX, centerZ),
      centerZ,
      width: context.config.plotWidth,
      depth: context.config.plotDepth,
      rotationY: -Math.atan2(tangentZ, tangentX),
      side: sideName,
    };
  }

  private isInsideChunk(context: ChunkGenerationContext, plot: PlotData, roadPoint: RoadPoint): boolean {
    const tangentLength = Math.hypot(roadPoint.tangentX, roadPoint.tangentZ);
    const tangentX = roadPoint.tangentX / tangentLength;
    const tangentZ = roadPoint.tangentZ / tangentLength;
    const normalX = -tangentZ;
    const normalZ = tangentX;
    const halfWidth = plot.width * 0.5;
    const halfDepth = plot.depth * 0.5;
    const minX = context.chunkX * context.config.chunkSize;
    const maxX = minX + context.config.chunkSize;
    const minZ = context.chunkZ * context.config.chunkSize;
    const maxZ = minZ + context.config.chunkSize;

    for (const along of [-1, 1]) {
      for (const across of [-1, 1]) {
        const cornerX = plot.centerX + tangentX * halfWidth * along + normalX * halfDepth * across;
        const cornerZ = plot.centerZ + tangentZ * halfWidth * along + normalZ * halfDepth * across;
        if (cornerX < minX || cornerX > maxX || cornerZ < minZ || cornerZ > maxZ) {
          return false;
        }
      }
    }

    return true;
  }
}
