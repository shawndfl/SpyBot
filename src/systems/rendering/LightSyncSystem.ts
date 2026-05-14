import * as THREE from 'three';
import { System } from '../../ecs/System';
import type { UpdateEvent } from '../../core/UpdateEvent';
import { TransformComponent } from '../../components/TransformComponent';
import { PointLightComponent } from '../../components/lights/PointLightComponent';
import { LightComponent } from '../../components/lights/LightComponent';

/**
 * This is like a subsystem to the render system for managing lights
 */
export class LightSyncSystem extends System {
  constructor(componentMask: number) {
    super(componentMask);
  }

  update({ world }: UpdateEvent): void {
    // loop over all the light components and make sure the threejs light is up to date
    for (let [, transform, point, lightComponent] of world.queryWithEntity(
      TransformComponent,
      PointLightComponent,
      LightComponent
    )) {
      const light = lightComponent.light as THREE.PointLight;
      light.color = new THREE.Color(point.color);
      light.intensity = point.intensity;
      light.distance = point.distance;

      light.castShadow = point.castShadow;
      light.position.copy(transform.position);
    }
  }
}
