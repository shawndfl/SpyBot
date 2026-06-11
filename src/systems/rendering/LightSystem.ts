import * as THREE from 'three';
import type { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import {
  LightComponent,
  LightType,
  type Light3Type,
  type LightHelperType,
} from '../../components/lights/LightComponent';
import { TransformComponent } from '../../components/TransformComponent';
import type { UpdateEvent } from '../../core/UpdateEvent';
import { System } from '../../ecs/System';
import type { World } from '../../ecs/World';
import { GuiDebugComponent } from '../../components/GuiDebugComponent';

interface LightDebugState {
  id: number;
  gui?: GUI;
  folder?: GUI;
  type?: LightType;
}

/**
 * Manages directional light, spot light and point lights.
 */
export class LightSystem extends System {
  private readonly spotDirection = new THREE.Vector3();
  private readonly debugStates = new WeakMap<LightComponent, LightDebugState>();
  private nextDebugId = 1;

  constructor(
    componentMask: number,
    private scene: THREE.Scene,
  ) {
    super(componentMask);
  }

  update({ world }: UpdateEvent): void {
    for (const [transform, lightComponent] of world.query(TransformComponent, LightComponent)) {
      const light = this.getOrCreateLight(lightComponent);

      light.color.copy(lightComponent.color);
      light.intensity = lightComponent.intensity;
      if (light instanceof THREE.PointLight || light instanceof THREE.SpotLight) {
        light.distance = lightComponent.distance;
        light.decay = lightComponent.decay;
      }
      light.castShadow = lightComponent.castShadow;

      // sync position of the light
      light.position.copy(transform.worldPosition);

      // handle spot light
      if (light instanceof THREE.SpotLight) {
        this.syncSpotLight(light, lightComponent, transform);
      }

      // handle direction light
      if (light instanceof THREE.DirectionalLight) {
        this.syncDirectionalLight(light, lightComponent, transform);
      }

      // update shadows
      this.syncShadow(light, lightComponent);

      // setup debug. Show Gui and helpers for lights
      if (lightComponent.debug) {
        this.setupDebug(world, lightComponent, transform);
      } else {
        this.cleanupDebug(lightComponent);
      }
    }
  }

  private setupDebug(world: World, lightComponent: LightComponent, transform: TransformComponent): void {
    const light = lightComponent.light;
    if (!light) {
      return;
    }

    this.syncLightHelper(lightComponent, light);
    this.syncShadowHelper(lightComponent, light);

    lightComponent.lightHelper?.update();
    lightComponent.helper?.update();

    const guiResult = world.query(GuiDebugComponent).next();
    const gui = guiResult.done ? undefined : guiResult.value[0].gui;
    if (gui) {
      this.setupDebugGui(gui, lightComponent, transform);
    }
  }

  private setupDebugGui(gui: GUI, lightComponent: LightComponent, transform: TransformComponent): void {
    const state = this.getDebugState(lightComponent);

    if (state.folder && state.gui === gui && state.type === lightComponent.type) {
      return;
    }

    state.folder?.destroy();
    state.gui = gui;
    state.type = lightComponent.type;
    state.folder = gui.addFolder(`Light ${state.id}: ${lightComponent.type}`);

    const folder = state.folder;
    const colorControl = { color: `#${lightComponent.color.getHexString()}` };

    folder.add(lightComponent, 'type', Object.values(LightType)).name('type').listen();
    folder
      .addColor(colorControl, 'color')
      .name('color')
      .onChange((color: string) => {
        lightComponent.color.set(color);
      });
    folder.add(lightComponent, 'intensity', 0, 20, 0.01).name('intensity').listen();

    const positionFolder = folder.addFolder('Position');
    positionFolder.add(transform.position, 'x', -100, 100, 0.01).name('x').listen().decimals(3);
    positionFolder.add(transform.position, 'y', -100, 100, 0.01).name('y').listen().decimals(3);
    positionFolder.add(transform.position, 'z', -100, 100, 0.01).name('z').listen().decimals(3);

    if (lightComponent.type !== LightType.point) {
      this.ensureEditableTarget(lightComponent, transform);

      const targetFolder = folder.addFolder('Target');
      targetFolder.add(lightComponent.target!, 'x', -100, 100, 0.01).name('x').listen().decimals(3);
      targetFolder.add(lightComponent.target!, 'y', -100, 100, 0.01).name('y').listen().decimals(3);
      targetFolder.add(lightComponent.target!, 'z', -100, 100, 0.01).name('z').listen().decimals(3);
    }

    if (lightComponent.type === LightType.point || lightComponent.type === LightType.spot) {
      const falloffFolder = folder.addFolder('Falloff');
      falloffFolder.add(lightComponent, 'distance', 0, 200, 0.1).name('distance').listen();
      falloffFolder.add(lightComponent, 'decay', 0, 10, 0.01).name('decay').listen();
    }

    if (lightComponent.type === LightType.spot) {
      const spotFolder = folder.addFolder('Spot');
      spotFolder
        .add(lightComponent, 'angle', 0.01, Math.PI / 2, 0.001)
        .name('angle')
        .listen();
      spotFolder.add(lightComponent, 'penumbra', 0, 1, 0.01).name('penumbra').listen();
    }

    const shadowFolder = folder.addFolder('Shadows');
    shadowFolder.add(lightComponent, 'castShadow').name('castShadow').listen();
    shadowFolder.add(lightComponent, 'shadowMapSize', 256, 4096, 256).name('mapSize').listen();
    shadowFolder.add(lightComponent, 'shadowBias', -0.01, 0.01, 0.00001).name('bias').listen();
    shadowFolder.add(lightComponent, 'shadowNormalBias', -1, 1, 0.001).name('normalBias').listen();
    shadowFolder.add(lightComponent, 'shadowRadius', 0, 10, 0.1).name('radius').listen();
    shadowFolder.add(lightComponent, 'shadowCameraNear', 0.01, 100, 0.01).name('near').listen();
    shadowFolder.add(lightComponent, 'shadowCameraFar', 0.01, 1000, 0.1).name('far').listen();
    shadowFolder.add(lightComponent, 'shadowAutoUpdate').name('autoUpdate').listen();
  }

  private getDebugState(lightComponent: LightComponent): LightDebugState {
    let state = this.debugStates.get(lightComponent);

    if (!state) {
      state = { id: this.nextDebugId++ };
      this.debugStates.set(lightComponent, state);
    }

    return state;
  }

  private ensureEditableTarget(lightComponent: LightComponent, transform: TransformComponent): void {
    if (lightComponent.target) {
      return;
    }

    if (lightComponent.lightTarget) {
      lightComponent.target = lightComponent.lightTarget.position.clone();
      return;
    }

    this.spotDirection.set(0, 0, -1).applyEuler(transform.rotation).normalize();
    lightComponent.target = transform.position.clone().add(this.spotDirection);
  }

  private syncLightHelper(lightComponent: LightComponent, light: Light3Type): void {
    if (!this.matchesLightHelper(lightComponent.lightHelper, lightComponent.type)) {
      this.disposeHelper(lightComponent.lightHelper);
      lightComponent.lightHelper = undefined;
    }

    if (lightComponent.lightHelper) {
      return;
    }

    if (light instanceof THREE.PointLight) {
      lightComponent.lightHelper = new THREE.PointLightHelper(light, 1);
    } else if (light instanceof THREE.SpotLight) {
      lightComponent.lightHelper = new THREE.SpotLightHelper(light);
    } else if (light instanceof THREE.DirectionalLight) {
      lightComponent.lightHelper = new THREE.DirectionalLightHelper(light, 1);
    }

    if (lightComponent.lightHelper) {
      this.scene.add(lightComponent.lightHelper);
    }
  }

  private matchesLightHelper(helper: LightHelperType | undefined, type: LightType): boolean {
    return (
      !helper ||
      (type === LightType.point && helper instanceof THREE.PointLightHelper) ||
      (type === LightType.spot && helper instanceof THREE.SpotLightHelper) ||
      (type === LightType.direction && helper instanceof THREE.DirectionalLightHelper)
    );
  }

  private syncShadowHelper(lightComponent: LightComponent, light: Light3Type): void {
    if (!lightComponent.castShadow) {
      this.disposeHelper(lightComponent.helper);
      lightComponent.helper = undefined;
      return;
    }

    if (lightComponent.helper?.camera !== light.shadow.camera) {
      this.disposeHelper(lightComponent.helper);
      lightComponent.helper = new THREE.CameraHelper(light.shadow.camera);
      this.scene.add(lightComponent.helper);
    }
  }

  private cleanupDebug(lightComponent: LightComponent): void {
    const state = this.debugStates.get(lightComponent);

    state?.folder?.destroy();
    this.debugStates.delete(lightComponent);

    this.disposeHelper(lightComponent.helper);
    this.disposeHelper(lightComponent.lightHelper);
    lightComponent.helper = undefined;
    lightComponent.lightHelper = undefined;
  }

  private disposeHelper(helper: (THREE.Object3D & { dispose: () => void }) | undefined): void {
    helper?.parent?.remove(helper);
    helper?.dispose();
  }

  /**
   * If the light object on the lightComponent match then return the light object
   * else create a new light and add it to the scene. This does not create the target that will
   * be dealt with in the sync functions for spot light and directional light
   * @param lightComponent
   * @returns
   */
  private getOrCreateLight(lightComponent: LightComponent): Light3Type {
    if (lightComponent.light && this.matchesType(lightComponent.light, lightComponent.type)) {
      return lightComponent.light;
    }

    // remove the old light and target
    lightComponent.light?.parent?.remove(lightComponent.light);
    lightComponent.lightTarget?.parent?.remove(lightComponent.lightTarget);
    lightComponent.lightTarget = undefined;

    switch (lightComponent.type) {
      case LightType.point:
        lightComponent.light = new THREE.PointLight();
        break;
      case LightType.spot:
        lightComponent.light = new THREE.SpotLight();
        break;
      case LightType.direction:
        lightComponent.light = new THREE.DirectionalLight();
        break;
    }

    this.scene.add(lightComponent.light);

    return lightComponent.light;
  }

  private matchesType(light: THREE.Light, type: LightType): boolean {
    return (
      (type === LightType.point && light instanceof THREE.PointLight) ||
      (type === LightType.spot && light instanceof THREE.SpotLight) ||
      (type === LightType.direction && light instanceof THREE.DirectionalLight)
    );
  }

  private syncSpotLight(light: THREE.SpotLight, lightComponent: LightComponent, transform: TransformComponent): void {
    light.angle = lightComponent.angle;
    light.penumbra = lightComponent.penumbra;

    if (!lightComponent.lightTarget) {
      lightComponent.lightTarget = new THREE.Object3D();
      this.scene.add(lightComponent.lightTarget);
    }

    if (lightComponent.target) {
      lightComponent.lightTarget.position.copy(lightComponent.target);
    } else {
      this.spotDirection.set(0, 0, -1).applyQuaternion(transform.worldRotation).normalize();
      lightComponent.lightTarget.position.copy(transform.worldPosition).add(this.spotDirection);
    }

    light.target = lightComponent.lightTarget;
    light.target.updateMatrixWorld();
  }

  private syncDirectionalLight(
    light: THREE.DirectionalLight,
    lightComponent: LightComponent,
    transform: TransformComponent,
  ): void {
    if (!lightComponent.lightTarget) {
      lightComponent.lightTarget = new THREE.Object3D();
      this.scene.add(lightComponent.lightTarget);
    }

    if (lightComponent.target) {
      lightComponent.lightTarget.position.copy(lightComponent.target);
    } else {
      this.spotDirection.set(0, 0, -1).applyQuaternion(transform.worldRotation).normalize();
      lightComponent.lightTarget.position.copy(transform.worldPosition).add(this.spotDirection);
    }

    light.target = lightComponent.lightTarget;
    light.target.updateMatrixWorld();
  }

  private syncShadow(light: Light3Type, lightComponent: LightComponent): void {
    if (!light.shadow) {
      return;
    }

    light.shadow.mapSize.set(lightComponent.shadowMapSize, lightComponent.shadowMapSize);
    light.shadow.bias = lightComponent.shadowBias;
    light.shadow.normalBias = lightComponent.shadowNormalBias;
    light.shadow.radius = lightComponent.shadowRadius;
    light.shadow.autoUpdate = lightComponent.shadowAutoUpdate;

    light.shadow.camera.near = lightComponent.shadowCameraNear;
    light.shadow.camera.far = lightComponent.shadowCameraFar;
    light.shadow.camera.updateProjectionMatrix();
  }
}
