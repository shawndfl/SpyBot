import * as THREE from 'three';
import { PlayerComponent } from '../../components/PlayerComponent';
import { ParticleEmitterComponent } from '../../components/particles/ParticleEmitterComponent';
import { ParticleEmitterStateComponent } from '../../components/particles/ParticleStateComponent';
import { RigidBodyComponent } from '../../components/physics/RigidBodyComponent';
import { TransformComponent } from '../../components/TransformComponent';
import { Engine } from '../../core/Engine';
import type { UpdateEvent } from '../../core/UpdateEvent';
import { System } from '../../ecs/System';
import type { Entity } from '../../ecs/Entity';
import type { World } from '../../ecs/World';
import { createProceduralGrassMaterial } from '../../rendering/ProceduralGrassMaterial';
import type { ChunkGenerator } from '../ChunkGenerator';
import type { ChunkData, PlotData, RoadData, TerrainData } from '../GenerationTypes';
import type { ProceduralConfig } from '../ProceduralConfig';

interface LoadedChunk {
  data: ChunkData;
  terrainMesh: THREE.Mesh;
  roadMeshes: THREE.Mesh[];
  plotVisualizations: PlotVisualization[];
  goldEmitterEntities: Entity[];
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
          this.loadChunk(world, chunkX, chunkZ);
        }
      }
    }

    for (const [key, chunk] of this.loadedChunks) {
      if (!desiredChunks.has(key)) {
        this.unloadChunk(world, chunk);
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

  private loadChunk(world: World, chunkX: number, chunkZ: number): void {
    const data = this.generator.generate(chunkX, chunkZ);
    const terrainMesh = this.createTerrainMesh(data.terrain);
    const roadMeshes = data.roads.map((road) => this.createRoadMesh(road));
    const plotVisualizations = data.plots.map((plot) => this.createPlotVisualization(plot));
    const goldEmitterEntities = data.gold.map((gold) => this.createGoldEmitter(world, gold));
    this.scene.add(terrainMesh, ...roadMeshes, ...plotVisualizations.map((visualization) => visualization.helper));
    this.loadedChunks.set(this.getChunkKey(chunkX, chunkZ), {
      data,
      terrainMesh,
      roadMeshes,
      plotVisualizations,
      goldEmitterEntities,
    });
  }

  private unloadChunk(world: World, chunk: LoadedChunk): void {
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
    for (const entity of chunk.goldEmitterEntities) {
      world.destroyEntity(entity);
    }
  }

  private createGoldEmitter(world: World, gold: ChunkData['gold'][number]): Entity {
    const entity = world.createEntity();
    world.addComponent(
      entity,
      new TransformComponent({
        name: gold.id,
        position: new THREE.Vector3(gold.x, gold.y + 0.35, gold.z),
      }),
      new ParticleEmitterComponent({
        materialId: 'gold-sparkle',
        maxParticles: 1024,
        emissionRate: 3 + gold.amount,
        lifetimeMin: 1.6,
        lifetimeMax: 2.2,
        speedMin: 0.05,
        speedMax: 0.08,
        sizeStart: 0.009,
        sizeEnd: 0.295,
        alphaStart: 1,
        alphaEnd: 0,
        minDirection: new THREE.Vector3(-0.4, 1, -0.4),
        maxDirection: new THREE.Vector3(0.4, 1, 0.4),
        colorStart: new THREE.Color(1, 0.72, 0.08),
        colorEnd: new THREE.Color(1, 0.95, 0.55),
        gravity: new THREE.Vector3(0, 0.01, 0),
        spawnRadius: 0.03,
      }),
      new ParticleEmitterStateComponent(),
    );
    return entity;
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
      const worldScale = new THREE.Vector2(this.config.textureRepeatPerUnit, this.config.textureRepeatPerUnit);
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
