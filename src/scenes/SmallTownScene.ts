import * as THREE from 'three';

import { SunLight } from '../components/SunLight';
import { Transform } from '../components/Transform';
import type { World } from '../ecs/World';
import { GameScene } from './GameScene';
import { PointLightComponent } from '../components/lights/PointLightComponent';
import { RendererComponent } from '../components/mesh/RendererComponent';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';

export class SmallTownScene extends GameScene {
  create(world: World): World {
    // create player
    const player = world.createEntity();
    world.addComponent(player, new MeshGlbComponent().setFilename('player.glb'));
    world.addComponent(player, new Transform());

    // create sun
    const sun = world.createEntity();
    world.addComponent(sun, new SunLight().setDayLengthInMs(120000).setStartTime(6));

    // create lamp post
    const lampPost = world.createEntity();
    world.addComponent(lampPost, new MeshGlbComponent().setFilename('lampPost.glb'));

    const pointLight = new PointLightComponent();
    pointLight.castShadow = true;
    pointLight.color = new THREE.Color(THREE.Color.NAMES.yellow);
    pointLight.distance = 5;

    world.addComponent(lampPost, pointLight);
    world.addComponent(lampPost, new Transform().setPosition(0, 0, -2));

    return world;
  }
}
