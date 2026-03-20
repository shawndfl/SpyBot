import { Transform } from '../components/Transform';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

export class MovementSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    //const inputEvents = events.get(GameEventNames.InputEvent);

    // Get all entities with Transform and Input components
    const transforms = world.getComponents(Transform);
    for (let transform of transforms) {
      transform.position.x += 1 * dt; // Move right at 1 unit per second
    }
    transforms.forEach((transform) => {});
  }
}
