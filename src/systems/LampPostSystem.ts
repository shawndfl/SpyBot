import { LampPostComponent } from '../components/LampPostComponent';
import { LightComponent } from '../components/lights/LightComponent';
import { LinkedEntity } from '../components/LinkedEntity';

import { SunLightComponent } from '../components/SunLightComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

export class LampPostSystem extends System {
  update({ world }: UpdateEvent): void {
    const [[sunComponent]] = world.query(SunLightComponent);

    for (const [, , linkedEntity] of world.query(LampPostComponent, TransformComponent, LinkedEntity)) {
      const light = world.getComponent(linkedEntity?.entity, LightComponent);
      if (sunComponent && light) {
        light.visible = !sunComponent.isDayTime;
      }
    }
  }
}
