import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

/**
 * The component describes the main environment for a battle
 */
export class BattleFieldComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(BattleFieldComponent);
  }

  battleGlbFilename: string = '';
  groundMesh?: THREE.Object3D;
  isLoading: boolean = false;

  playerAnchor?: THREE.Object3D;

  constructor(init?: Partial<BattleFieldComponent>) {
    super();
    Object.assign(this, init);
  }

  destroy(): void {
    this.groundMesh?.parent?.remove(this.groundMesh);
  }
}
