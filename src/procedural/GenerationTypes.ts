export interface TerrainData {
  chunkX: number;
  chunkZ: number;
  originX: number;
  originZ: number;
  chunkSize: number;
  sampleSpacing: number;
  verticesPerSide: number;
  heights: Float32Array;
  normals: Float32Array;
}
