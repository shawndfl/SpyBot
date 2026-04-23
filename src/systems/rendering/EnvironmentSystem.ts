import type { UpdateEvent } from '../../core/UpdateEvent';
import { System } from '../../ecs/System';
import type { SunManager } from '../../lights/SunManager';

/**
 * This system manages the environment map for the scene.
 * It does not need to interact with components, but access resources
 */
export class EnvironmentSystem extends System {
  constructor(private _sunManager: SunManager) {
    super(0);
  }

  update({ world, dt, events, commands }: UpdateEvent): void {}
}
