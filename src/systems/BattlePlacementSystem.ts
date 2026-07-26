//import * as THREE from 'three';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
//import { GameInputEvent } from '../events/GameInputEvent';
import { AnimationComponent } from '../components/AnimationComponent';
import { TerrainHeightResource } from '../procedural/resources/TerrainHeightResource';

export class BattlePlacementSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    //const [inputEvents] = events.get(GameInputEvent);

    const terrain = world.resources.hasResource(TerrainHeightResource)
      ? world.resources.getResource(TerrainHeightResource)
      : undefined;
    // player update
    for (let [, transform, animation] of world.query(PlayerComponent, TransformComponent, AnimationComponent)) {
      animation.play('Idle');

      const height = terrain?.getHeight(transform.position.x, transform.position.z) ?? 0;
      transform.position.y = height;
    }
  }
}
