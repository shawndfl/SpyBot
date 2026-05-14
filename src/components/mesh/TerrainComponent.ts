import * as THREE from 'three';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

export class TerrainComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(TerrainComponent);
  }

  width = 100;
  depth = 100;
  segments = 100;
  heightScale: number = 1;
  repeat: THREE.Vector2 = new THREE.Vector2(10, 10);

  grassTexturePath?: string = '/textures/grass.jpg';

  /**
   * this function will be set by the TerrainSystem
   */
  getHeight?: (x: number, z: number) => number;

  mesh?: THREE.Mesh;

  constructor(init?: Partial<TerrainComponent>) {
    super();
    Object.assign(this, init);
  }
}
