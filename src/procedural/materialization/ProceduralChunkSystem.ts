import * as THREE from 'three';
import { PlayerComponent } from '../../components/PlayerComponent';
import { RigidBodyComponent } from '../../components/physics/RigidBodyComponent';
import { TransformComponent } from '../../components/TransformComponent';
import { Engine } from '../../core/Engine';
import type { UpdateEvent } from '../../core/UpdateEvent';
import { System } from '../../ecs/System';
import { createProceduralGrassMaterial } from '../../rendering/ProceduralGrassMaterial';
import type { ChunkGenerator } from '../ChunkGenerator';
import type { ChunkData, PlotData, RoadData, TerrainData } from '../GenerationTypes';
import type { ProceduralConfig } from '../ProceduralConfig';

interface LoadedChunk {
  data: ChunkData;
  terrainMesh: THREE.Mesh;
  roadMeshes: THREE.Mesh[];
  plotVisualizations: PlotVisualization[];
}

interface PlotVisualization {
  source: THREE.Mesh;
  helper: THREE.BoxHelper;
}

/** Materializes and streams generated chunks around the player. */
export class ProceduralChunkSystem extends System {
  private readonly loadedChunks = new Map<string, LoadedChunk>();
  private terrainMaterial?: THREE.ShaderMaterial;
  private roadMaterial?: THREE.MeshStandardMaterial;
  private readonly plotSourceMaterial = new THREE.MeshBasicMaterial({ visible: false });

  constructor(
    private readonly scene: THREE.Scene,
    private readonly generator: ChunkGenerator,
    private readonly config: Readonly<ProceduralConfig>,
  ) {
    super();
  }

  update({ world }: UpdateEvent): void {
    const playerPosition = this.getPlayerPosition(world);
    if (!playerPosition) {
      return;
    }

    const centerChunkX = Math.floor(playerPosition.x / this.config.chunkSize);
    const centerChunkZ = Math.floor(playerPosition.z / this.config.chunkSize);
    const desiredChunks = new Set<string>();

    for (let z = -this.config.activeChunkRadius; z <= this.config.activeChunkRadius; z++) {
      for (let x = -this.config.activeChunkRadius; x <= this.config.activeChunkRadius; x++) {
        const chunkX = centerChunkX + x;
        const chunkZ = centerChunkZ + z;
        const key = this.getChunkKey(chunkX, chunkZ);
        desiredChunks.add(key);
        if (!this.loadedChunks.has(key)) {
          this.loadChunk(chunkX, chunkZ);
        }
      }
    }

    for (const [key, chunk] of this.loadedChunks) {
      if (!desiredChunks.has(key)) {
        this.unloadChunk(chunk);
        this.loadedChunks.delete(key);
      }
    }
  }

  private getPlayerPosition(world: UpdateEvent['world']): THREE.Vector3Like | undefined {
    for (const [, transform, rigidBody] of world.query(PlayerComponent, TransformComponent, RigidBodyComponent)) {
      return rigidBody.body?.translation() ?? rigidBody.initialPosition ?? transform.position;
    }
    return undefined;
  }

  private loadChunk(chunkX: number, chunkZ: number): void {
    const data = this.generator.generate(chunkX, chunkZ);
    const terrainMesh = this.createTerrainMesh(data.terrain);
    const roadMeshes = data.roads.map((road) => this.createRoadMesh(road));
    const plotVisualizations = data.plots.map((plot) => this.createPlotVisualization(plot));
    this.scene.add(
      terrainMesh,
      ...roadMeshes,
      ...plotVisualizations.map((visualization) => visualization.helper),
    );
    this.loadedChunks.set(this.getChunkKey(chunkX, chunkZ), {
      data,
      terrainMesh,
      roadMeshes,
      plotVisualizations,
    });
  }

  private unloadChunk(chunk: LoadedChunk): void {
    this.scene.remove(
      chunk.terrainMesh,
      ...chunk.roadMeshes,
      ...chunk.plotVisualizations.map((visualization) => visualization.helper),
    );
    chunk.terrainMesh.geometry.dispose();
    for (const road of chunk.roadMeshes) {
      road.geometry.dispose();
    }
    for (const visualization of chunk.plotVisualizations) {
      visualization.source.geometry.dispose();
      visualization.helper.dispose();
    }
  }

  private createTerrainMesh(data: TerrainData): THREE.Mesh {
    const vertexCount = data.verticesPerSide * data.verticesPerSide;
    const positions = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices: number[] = [];

    for (let z = 0; z < data.verticesPerSide; z++) {
      for (let x = 0; x < data.verticesPerSide; x++) {
        const index = z * data.verticesPerSide + x;
        const positionOffset = index * 3;
        const uvOffset = index * 2;
        positions[positionOffset] = x * data.sampleSpacing;
        positions[positionOffset + 1] = data.heights[index];
        positions[positionOffset + 2] = z * data.sampleSpacing;
        uvs[uvOffset] = x / (data.verticesPerSide - 1);
        uvs[uvOffset + 1] = z / (data.verticesPerSide - 1);
      }
    }

    for (let z = 0; z < data.verticesPerSide - 1; z++) {
      for (let x = 0; x < data.verticesPerSide - 1; x++) {
        const topLeft = z * data.verticesPerSide + x;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + data.verticesPerSide;
        const bottomRight = bottomLeft + 1;
        indices.push(topLeft, bottomLeft, topRight, topRight, bottomLeft, bottomRight);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();

    const mesh = new THREE.Mesh(geometry, this.getTerrainMaterial());
    mesh.name = `terrain_${data.chunkX}_${data.chunkZ}`;
    mesh.position.set(data.originX, 0, data.originZ);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    return mesh;
  }

  private createRoadMesh(road: RoadData): THREE.Mesh {
    const positions = new Float32Array(road.points.length * 2 * 3);
    const uvs = new Float32Array(road.points.length * 2 * 2);
    const indices: number[] = [];
    let distance = 0;

    for (let index = 0; index < road.points.length; index++) {
      const point = road.points[index];
      const previous = road.points[Math.max(0, index - 1)];
      const tangentX = point.tangentX;
      const tangentZ = point.tangentZ;
      const inverseLength = 1 / Math.hypot(tangentX, tangentZ);
      const offsetX = -tangentZ * inverseLength * road.width * 0.5;
      const offsetZ = tangentX * inverseLength * road.width * 0.5;
      const vertexOffset = index * 6;
      positions.set([point.x + offsetX, point.y + 0.04, point.z + offsetZ], vertexOffset);
      positions.set([point.x - offsetX, point.y + 0.04, point.z - offsetZ], vertexOffset + 3);

      if (index > 0) {
        distance += Math.hypot(point.x - previous.x, point.z - previous.z);
      }
      const uvOffset = index * 4;
      uvs.set([0, distance / road.width, 1, distance / road.width], uvOffset);

      if (index < road.points.length - 1) {
        const left = index * 2;
        indices.push(left, left + 2, left + 1, left + 2, left + 3, left + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, this.getRoadMaterial());
    mesh.name = road.id;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createPlotVisualization(plot: PlotData): PlotVisualization {
    const geometry = new THREE.BoxGeometry(plot.width, 0.25, plot.depth);
    const source = new THREE.Mesh(geometry, this.plotSourceMaterial);
    source.name = plot.id;
    source.position.set(plot.centerX, plot.centerY + 0.125, plot.centerZ);
    source.rotation.y = plot.rotationY;
    source.updateMatrixWorld(true);

    const helper = new THREE.BoxHelper(source, 0xffd700);
    helper.name = `${plot.id}_helper`;
    helper.update();
    return { source, helper };
  }

  private getTerrainMaterial(): THREE.ShaderMaterial {
    if (!this.terrainMaterial) {
      const worldScale = new THREE.Vector2(
        this.config.textureRepeatPerUnit,
        this.config.textureRepeatPerUnit,
      );
      this.terrainMaterial = createProceduralGrassMaterial(new THREE.Vector2(1, 1), worldScale);
    }
    return this.terrainMaterial;
  }

  private getRoadMaterial(): THREE.MeshStandardMaterial {
    if (!this.roadMaterial) {
      const roadTexture = Engine.assets.getTexture(this.config.roadTexturePath);
      roadTexture.wrapS = THREE.RepeatWrapping;
      roadTexture.wrapT = THREE.RepeatWrapping;
      roadTexture.colorSpace = THREE.SRGBColorSpace;
      this.roadMaterial = new THREE.MeshStandardMaterial({ map: roadTexture, roughness: 0.95 });
    }
    return this.roadMaterial;
  }

  private getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }
}
