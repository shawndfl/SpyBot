import * as THREE from 'three';
import { System } from '../../ecs/System';
import type { UpdateEvent } from '../../core/UpdateEvent';
import { GameEventNames } from '../../events/GameEventNames';
import { Transform } from '../../components/Transform';
import { PointLightComponent } from '../../components/Lights/PointLightComponent';
import { LightComponent } from '../../components/Lights/LightComponent';

/**
 * This is like a subsystem to the render system for managing lights
 */
export class LightSystem extends System {
  constructor(componentMask: number, private _scene: THREE.Scene) {
    super(componentMask);
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    const [initializeEvent] = events.get(GameEventNames.InitializeLevel);
    if (initializeEvent) {
      // loop over all the light components and make sure the threejs light is up to date
      for (let [entity, transform, point] of world.queryWithEntity(Transform, PointLightComponent)) {
        let lightComponent: LightComponent;
        if (world.getHasComponent(entity, LightComponent)) {
          lightComponent = world.getComponent(entity, LightComponent);
        } else {
          lightComponent = new LightComponent(new THREE.PointLight());
          this._scene.add(lightComponent.light);
          world.addComponent(entity, lightComponent);
        }

        if (!(lightComponent.light instanceof THREE.PointLight)) {
          lightComponent.light = new THREE.PointLight();
          this._scene.add(lightComponent.light);
        }

        const light = lightComponent.light as THREE.PointLight;
        light.color = new THREE.Color(point.color);
        light.intensity = point.intensity;
        light.distance = point.distance;

        light.castShadow = point.castShadow;
        light.position.copy(transform.position);

        //newLight.
      }
    }
  }
}
