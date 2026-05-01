import * as THREE from 'three';
import { System } from '../../ecs/System';
import type { UpdateEvent } from '../../core/UpdateEvent';
import { TransformComponent } from '../../components/TransformComponent';
import { PointLightComponent } from '../../components/lights/PointLightComponent';
import { LightComponent } from '../../components/lights/LightComponent';

/**
 * This is like a subsystem to the render system for managing lights
 */
export class LightInitSystem extends System {
  constructor(componentMask: number, private _scene: THREE.Scene) {
    super(componentMask);
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    // loop over all the entities that have transforms and point lights and make sure
    // they get light components
    for (let [entity, ,] of world.queryWithEntity(TransformComponent, PointLightComponent)) {
      let lightComponent: LightComponent;

      if (world.hasComponent(entity, LightComponent)) {
        lightComponent = world.getComponent(entity, LightComponent);
      } else {
        lightComponent = new LightComponent(new THREE.PointLight());
        this._scene.add(lightComponent.light);
        world.addComponent(entity, lightComponent);
      }

      if (!(lightComponent.light instanceof THREE.PointLight)) {
        // remove it from its parent
        lightComponent.light.parent?.remove(lightComponent.light);
        // create a point light and add it to the scene
        lightComponent.light = new THREE.PointLight();
        this._scene.add(lightComponent.light);
      }
    }
  }
}
