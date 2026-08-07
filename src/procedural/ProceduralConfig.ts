export interface ProceduralConfig {
  seed: number;
  chunkSize: number;
  sampleSpacing: number;
  activeChunkRadius: number;
  heightScale: number;
  grassTexturePath: string;
  textureRepeatPerUnit: number;
  roadWidth: number;
  roadSamples: number;
  roadTexturePath: string;
  plotsPerRoadSide: number;
  plotWidth: number;
  plotDepth: number;
  plotRoadSetback: number;
}

export const DEFAULT_PROCEDURAL_CONFIG: Readonly<ProceduralConfig> = {
  seed: 1337,
  chunkSize: 64,
  sampleSpacing: 2,
  activeChunkRadius: 1,
  heightScale: 0.2,
  grassTexturePath: 'grass.jpg',
  textureRepeatPerUnit: 0.5,
  roadWidth: 6,
  roadSamples: 16,
  roadTexturePath: 'rocky_trail_diff_1k.jpg',
  plotsPerRoadSide: 3,
  plotWidth: 10,
  plotDepth: 12,
  plotRoadSetback: 2,
};
