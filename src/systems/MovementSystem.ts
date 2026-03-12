import { Transform } from '../components/Transform';
import { ComponentNames } from '../ecs/ComponentNames';
import type { EventBus } from '../ecs/EventSystem';
import { System } from '../ecs/System';
import type { World } from '../ecs/World';
//import { GameEventNames } from '../events/GameEventNames';

export class MovementSystem extends System {
  update(world: World, delta: number, events: EventBus): void {
    //const inputEvents = events.get(GameEventNames.InputEvent);

    // Get all entities with Transform and Input components
    const transforms = world.getComponents<Transform>(ComponentNames.Transform);
    for (let transform of transforms) {
      transform.position.x += 1 * delta; // Move right at 1 unit per second
    }
    transforms.forEach((transform) => {});
  }
}
