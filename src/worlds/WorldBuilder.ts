import { Renderer } from '../components/Renderer';
import { Transform } from '../components/Transform';
import type { World } from '../ecs/World';

export class WorldBuilder {
  protected _world: World;

  constructor(world: World) {
    this._world = world;
  }

  addPlayer(): WorldBuilder {
    const player = this._world.createEntity();
    const renderer = new Renderer();
    renderer.gltfName = 'player.glb';
    this._world.addComponent(player, renderer);
    this._world.addComponent(player, new Transform());
    return this;
  }
}
