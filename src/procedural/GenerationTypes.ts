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

export interface RoadPoint {
  x: number;
  y: number;
  z: number;
  tangentX: number;
  tangentZ: number;
}

export interface RoadData {
  id: string;
  width: number;
  points: RoadPoint[];
}

export interface PlotData {
  id: string;
  roadId: string;
  centerX: number;
  centerY: number;
  centerZ: number;
  width: number;
  depth: number;
  rotationY: number;
  side: 'left' | 'right';
}

export interface GoldData {
  id: string;
  x: number;
  y: number;
  z: number;
  amount: number;
}

export interface ChunkData {
  chunkX: number;
  chunkZ: number;
  terrain: TerrainData;
  roads: RoadData[];
  plots: PlotData[];
  gold: GoldData[];
}
