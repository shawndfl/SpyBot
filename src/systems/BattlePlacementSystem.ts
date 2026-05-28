//import * as THREE from 'three';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
//import { GameInputEvent } from '../events/GameInputEvent';
import { AnimationComponent } from '../components/AnimationComponent';
import { TerrainComponent } from '../components/mesh/TerrainComponent';

export class BattlePlacementSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    //const [inputEvents] = events.get(GameInputEvent);

    let getHeightFromTerrain: (x: number, z: number) => number;

    for (let [terrainComponent] of world.query(TerrainComponent)) {
      getHeightFromTerrain = terrainComponent.getHeight!;
    }
    // player update
    for (let [, transform, animation] of world.query(PlayerComponent, TransformComponent, AnimationComponent)) {
      animation.play('Idle');

      const height = getHeightFromTerrain! ? getHeightFromTerrain(transform.position.x, transform.position.z) : 0;
      transform.position.y = height;
    }
  }
}
