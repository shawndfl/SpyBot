import * as THREE from 'three';
import { System } from '../ecs/System';
import type { UpdateEvent } from '../core/UpdateEvent';
import { TerrainComponent } from '../components/mesh/TerrainComponent';
import { TransformComponent } from '../components/TransformComponent';

export class TerrainSystem extends System {
  private textureLoader = new THREE.TextureLoader();

  constructor(componentMask: number, private _scene: THREE.Scene) {
    super(componentMask);
  }

  update(data: UpdateEvent): void {
    const { world, dt, events, commands } = data;
    for (let [terrainComponent, transform] of world.query(TerrainComponent, TransformComponent)) {
      if (!terrainComponent.mesh) {
        terrainComponent.mesh = this.createTerrainMesh(terrainComponent);
        this._scene.add(terrainComponent.mesh);
      }

      terrainComponent.getHeight = (x, z) => this.getHeight(x, z);

      terrainComponent.mesh.position.copy(transform.position);
      terrainComponent.mesh.rotation.copy(transform.rotation);
      terrainComponent.mesh.scale.copy(transform.scale);
    }
  }

  private createTerrainMesh(terrain: TerrainComponent): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(terrain.width, terrain.depth, terrain.segments, terrain.segments);

    geometry.rotateX(-Math.PI / 2);

    const position = geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);

      const height = this.getHeight(x, z);

      position.setY(i, height);
    }

    geometry.computeVertexNormals();

    const material = terrain.grassTexturePath
      ? this.createGrassMaterial(terrain.grassTexturePath, terrain)
      : new THREE.MeshStandardMaterial({
          color: 0x3f8f3f,
          roughness: 1,
        });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;

    return mesh;
  }

  protected getHeight(x: number, z: number): number {
    return Math.sin(x * 0.15) * 1.5 + Math.cos(z * 0.12) * 1.2 + Math.sin((x + z) * 0.08) * 1.0;
  }

  private createGrassMaterial(texturePath: string, terrain: TerrainComponent): THREE.MeshStandardMaterial {
    const grassTexture = this.textureLoader.load(texturePath);

    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(terrain.repeat.x, terrain.repeat.y);
    grassTexture.colorSpace = THREE.SRGBColorSpace;

    return new THREE.MeshStandardMaterial({
      map: grassTexture,
      roughness: 1,
    });
  }
}
