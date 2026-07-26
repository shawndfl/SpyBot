import * as THREE from 'three';
import { PlayerComponent } from '../../components/PlayerComponent';
import { RigidBodyComponent } from '../../components/physics/RigidBodyComponent';
import { TransformComponent } from '../../components/TransformComponent';
import { Engine } from '../../core/Engine';
import type { UpdateEvent } from '../../core/UpdateEvent';
import { System } from '../../ecs/System';
import type { TerrainData } from '../GenerationTypes';
import type { TerrainGenerator } from '../generators/TerrainGenerator';
import type { ProceduralTerrainConfig } from '../ProceduralConfig';

interface LoadedTerrainChunk {
  data: TerrainData;
  mesh: THREE.Mesh;
}

/** Materializes and streams generated terrain chunks around the player. */
export class ProceduralTerrainSystem extends System {
  private readonly loadedChunks = new Map<string, LoadedTerrainChunk>();
  private material?: THREE.MeshStandardMaterial;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly generator: TerrainGenerator,
    private readonly config: Readonly<ProceduralTerrainConfig>,
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
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
        this.loadedChunks.delete(key);
      }
    }
  }

  private getPlayerPosition(world: UpdateEvent['world']): THREE.Vector3Like | undefined {
    for (const [, transform, rigidBody] of world.query(PlayerComponent, TransformComponent, RigidBodyComponent)) {
      const physicsPosition = rigidBody.body?.translation();
      return physicsPosition ?? rigidBody.initialPosition ?? transform.position;
    }
    return undefined;
  }

  private loadChunk(chunkX: number, chunkZ: number): void {
    const data = this.generator.generate({ chunkX, chunkZ, config: this.config });
    const geometry = this.createGeometry(data);
    const mesh = new THREE.Mesh(geometry, this.getMaterial());
    mesh.name = `terrain_${chunkX}_${chunkZ}`;
    mesh.position.set(data.originX, 0, data.originZ);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.loadedChunks.set(this.getChunkKey(chunkX, chunkZ), { data, mesh });
  }

  private createGeometry(data: TerrainData): THREE.BufferGeometry {
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
    return geometry;
  }

  private getMaterial(): THREE.MeshStandardMaterial {
    if (!this.material) {
      const grassTexture = Engine.assets.getTexture(this.config.grassTexturePath);
      grassTexture.wrapS = THREE.RepeatWrapping;
      grassTexture.wrapT = THREE.RepeatWrapping;
      grassTexture.repeat.set(
        this.config.chunkSize * this.config.textureRepeatPerUnit,
        this.config.chunkSize * this.config.textureRepeatPerUnit,
      );
      grassTexture.colorSpace = THREE.SRGBColorSpace;
      this.material = new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 1 });
    }
    return this.material;
  }

  private getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX},${chunkZ}`;
  }
}
