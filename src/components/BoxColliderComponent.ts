import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class BoxColliderComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(BoxColliderComponent);
  }

  private _box: THREE.Box3 = new THREE.Box3();
  private _halfSize: THREE.Vector3 = new THREE.Vector3(0.5, 0.5, 0.5);
  private _center: THREE.Vector3 = new THREE.Vector3();

  /**
   * Local-space size of the collider.
   */
  size: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  /**
   * Local-space offset from the entity transform.
   */
  offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  /**
   * If true, this collider blocks movement.
   */
  solid: boolean = true;

  /**
   * If true, this collider is moved by gameplay.
   * If false, it is treated like a wall/tree/rock.
   */
  dynamic: boolean = false;

  /**
   * Show a debug box
   */
  debug: boolean = false;
  debugMesh?: THREE.LineSegments;

  constructor(init?: Partial<BoxColliderComponent>) {
    super();
    Object.assign(this, init);
  }

  getBox(position: THREE.Vector3): THREE.Box3 {
    return this.updateBox(position);
  }

  protected updateBox(position: THREE.Vector3): THREE.Box3 {
    const center = this._center.copy(position).add(this.offset);

    this._box.min.copy(center).sub(this._halfSize);
    this._box.max.copy(center).add(this._halfSize);

    return this._box;
  }
}
