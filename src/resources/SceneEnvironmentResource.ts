import * as THREE from 'three';
import { Resource } from '../ecs/Resource';

export class SceneEnvironmentResource extends Resource {
  constructor(private _scene: THREE.Scene) {
    super();
  }
}
