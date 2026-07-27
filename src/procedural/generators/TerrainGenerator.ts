import type { ChunkGenerationContext } from '../GenerationContext';
import type { TerrainData } from '../GenerationTypes';
import type { ProceduralConfig } from '../ProceduralConfig';

/**
 * Generates deterministic terrain data and provides the canonical world-space
 * height function used by both terrain rendering and gameplay systems.
 */
export class TerrainGenerator {
  private readonly phaseX: number;
  private readonly phaseZ: number;

  constructor(private readonly config: Readonly<ProceduralConfig>) {
    if (config.chunkSize <= 0) {
      throw new Error('Procedural terrain chunkSize must be greater than zero');
    }
    if (config.sampleSpacing <= 0 || config.chunkSize % config.sampleSpacing !== 0) {
      throw new Error('Procedural terrain sampleSpacing must divide chunkSize evenly');
    }

    this.phaseX = this.seedToUnit(config.seed, 0x68bc21eb) * Math.PI * 2;
    this.phaseZ = this.seedToUnit(config.seed, 0x02e5be93) * Math.PI * 2;
  }

  generate(context: ChunkGenerationContext): TerrainData {
    const { chunkX, chunkZ } = context;
    const { chunkSize, sampleSpacing } = context.config;
    const verticesPerSide = chunkSize / sampleSpacing + 1;
    const originX = chunkX * chunkSize;
    const originZ = chunkZ * chunkSize;
    const heights = new Float32Array(verticesPerSide * verticesPerSide);
    const normals = new Float32Array(verticesPerSide * verticesPerSide * 3);

    for (let z = 0; z < verticesPerSide; z++) {
      for (let x = 0; x < verticesPerSide; x++) {
        const index = z * verticesPerSide + x;
        const worldX = originX + x * sampleSpacing;
        const worldZ = originZ + z * sampleSpacing;

        heights[index] = this.getHeight(worldX, worldZ);
        this.writeNormal(normals, index, worldX, worldZ, sampleSpacing);
      }
    }

    return {
      chunkX,
      chunkZ,
      originX,
      originZ,
      chunkSize,
      sampleSpacing,
      verticesPerSide,
      heights,
      normals,
    };
  }

  getHeight(worldX: number, worldZ: number): number {
    const x = worldX * 0.15 + this.phaseX;
    const z = worldZ * 0.12 + this.phaseZ;
    const diagonal = (worldX + worldZ) * 0.08 + (this.phaseX + this.phaseZ) * 0.5;

    return (Math.sin(x) * 1.5 + Math.cos(z) * 1.2 + Math.sin(diagonal)) * this.config.heightScale;
  }

  private writeNormal(
    normals: Float32Array,
    vertexIndex: number,
    worldX: number,
    worldZ: number,
    sampleSpacing: number,
  ): void {
    const left = this.getHeight(worldX - sampleSpacing, worldZ);
    const right = this.getHeight(worldX + sampleSpacing, worldZ);
    const down = this.getHeight(worldX, worldZ - sampleSpacing);
    const up = this.getHeight(worldX, worldZ + sampleSpacing);
    const normalX = left - right;
    const normalY = sampleSpacing * 2;
    const normalZ = down - up;
    const inverseLength = 1 / Math.hypot(normalX, normalY, normalZ);
    const offset = vertexIndex * 3;

    normals[offset] = normalX * inverseLength;
    normals[offset + 1] = normalY * inverseLength;
    normals[offset + 2] = normalZ * inverseLength;
  }

  private seedToUnit(seed: number, salt: number): number {
    let value = Math.imul(seed ^ salt, 0x45d9f3b);
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
    value ^= value >>> 16;
    return (value >>> 0) / 0x100000000;
  }
}
