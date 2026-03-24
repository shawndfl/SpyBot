import { Renderer } from '../components/Renderer';
import { SunLight } from '../components/SunLight';
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

    const sun = world.createEntity();
    world.addComponent(sun, new SunLight().setDayLengthInMs(120000).setStartTime(6));

    const lampPost = world.createEntity();
    world.addComponent(lampPost, new Renderer().setGltfName('lampPost.glb'));
    world.addComponent(lampPost, new Transform().setPosition(0, 0, -2));

    return world;
  }
}
