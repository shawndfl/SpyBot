import * as THREE from 'three';
import type { World } from '../ecs/World';
import { TransformComponent } from '../components/TransformComponent';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';

import { PointLightComponent } from '../components/lights/PointLightComponent';
import { LampPostComponent } from '../components/LampPostComponent';
import { LinkedEntity } from '../components/LinkedEntity';
import { ColliderComponent } from '../components/physics/ColliderComponent';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';

export interface LampPostArgs {
  position: THREE.Vector3;
  debug?: boolean;
  color: THREE.Color; //new THREE.Color(THREE.Color.NAMES.yellow),
}

/**
 * Props are static meshes that just look good in the background. Some of them you can collide with
 */
export class PropFactory {
  /**
   * Adds a lampPost to the world
   * @param world
   * @param args
   */
  static addLampPost(world: World, args: LampPostArgs): void {
    const position = args.position ?? new THREE.Vector3();
    const lightColor = args.color ?? new THREE.Color(THREE.Color.NAMES.yellow);

    // create lamp post
    const lampPost = world.createEntity();
    const lampLight = world.createEntity();

    // linked to the light
    const lampPostTransform = new TransformComponent();

    world.addComponent(lampPost, new MeshGlbComponent({ filename: 'lampPost.glb', useTerrainHeight: true }));
    world.addComponent(lampPost, new LampPostComponent());
    world.addComponent(lampPost, lampPostTransform);
    world.addComponent(lampPost, new LinkedEntity({ name: 'light', entity: lampLight }));
    world.addComponent(
      lampPost,
      new ColliderComponent({}),
      new RigidBodyComponent({ type: 'fixed', initialPosition: position }),
    );

    world.addComponent(
      lampLight,
      new PointLightComponent({
        castShadow: true,
        debug: args.debug,
        color: lightColor,
        distance: 5,
        decay: 0.4,
        angle: 0.512,
        penumbra: 0.58,
        shadowCameraNear: 0.5,
        shadowCameraFar: 20,
        intensity: 10,
      }),
    );

    world.addComponent(
      lampLight,
      new TransformComponent({
        position: new THREE.Vector3(0, 2, 0),
      }).parentTo(lampPostTransform.root),
    );
  }
}
