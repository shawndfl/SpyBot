export interface ProceduralTerrainConfig {
  seed: number;
  chunkSize: number;
  sampleSpacing: number;
  activeChunkRadius: number;
  heightScale: number;
  grassTexturePath: string;
  textureRepeatPerUnit: number;
}

export const DEFAULT_PROCEDURAL_TERRAIN_CONFIG: Readonly<ProceduralTerrainConfig> = {
  seed: 1337,
  chunkSize: 64,
  sampleSpacing: 2,
  activeChunkRadius: 1,
  heightScale: 0.2,
  grassTexturePath: 'grass.jpg',
  textureRepeatPerUnit: 0.5,
};
