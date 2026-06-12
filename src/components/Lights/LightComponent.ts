import * as THREE from 'three';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

export enum LightType {
  point = 'point',
  spot = 'spot',
  direction = 'direction',
}

export type Light3Type = THREE.PointLight | THREE.SpotLight | THREE.DirectionalLight;
export type LightHelperType = THREE.PointLightHelper | THREE.SpotLightHelper | THREE.DirectionalLightHelper;

export class LightComponent extends Component {
  type: LightType = LightType.point;
  color: THREE.Color = new THREE.Color(THREE.Color.NAMES.white);
  intensity: number = 1;
  distance: number = 0;
  decay: number = 2;
  castShadow: boolean = false;

  visible: boolean = true;

  angle: number = Math.PI / 3;
  penumbra: number = 0;
  target?: THREE.Vector3;

  shadowMapSize: number = 1024;
  shadowBias: number = 0;
  shadowNormalBias: number = 0;
  shadowRadius: number = 1;
  shadowCameraNear: number = 0.05;
  shadowCameraFar: number = 500;
  shadowAutoUpdate: boolean = true;

  light?: Light3Type;
  lightTarget?: THREE.Object3D;

  debug?: boolean;
  helper?: THREE.CameraHelper;
  lightHelper?: LightHelperType;

  get mask(): number {
    return ComponentRegistry.getId(LightComponent);
  }

  constructor(init?: Partial<LightComponent>) {
    super();

    if (init instanceof THREE.Light) {
      this.light = init as Light3Type;
    } else {
      Object.assign(this, init);
    }
  }

  destroy(): void {
    this.light?.parent?.remove(this.light);
    this.lightTarget?.parent?.remove(this.lightTarget);
    this.helper?.parent?.remove(this.helper);
    this.lightHelper?.parent?.remove(this.lightHelper);
    this.light?.dispose();
    this.helper?.dispose();
    this.lightHelper?.dispose();
  }
}
