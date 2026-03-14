import { Renderer } from '../components/Renderer';
import { Transform } from '../components/Transform';
import type { World } from '../ecs/World';
import { GameScene } from './GameScene';

export class SmallTownScene extends GameScene {
  create(world: World): World {
    const player = world.createEntity();
    const renderer = new Renderer();
    renderer.gltfName = 'player.glb';

    world.addComponent(player, renderer);
    world.addComponent(player, new Transform());
    return world;
  }
}
