import * as THREE from 'three';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

export class PointLightComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(PointLightComponent);
  }
  color: THREE.Color = new THREE.Color(THREE.Color.NAMES.blue);
  intensity: number = 1;
  distance: number = 0.5;
  decay: number = 2;
  castShadow: boolean = false;
}
