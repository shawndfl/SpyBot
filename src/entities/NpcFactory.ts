import * as THREE from 'three';
import { AnimationComponent } from '../components/AnimationComponent';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';
import { ColliderComponent } from '../components/physics/ColliderComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { Entity } from '../ecs/Entity';
import type { World } from '../ecs/World';
import { ColliderSensorComponent } from '../components/physics/ColliderSensorComponent';

export interface NpcArgs {
  position?: THREE.Vector3;
  debug?: boolean;
  filename?: string;
  name?: string;
}

export class NpcFactory {
  static addNpc(world: World, args: NpcArgs = {}): Entity {
    const npc = world.createEntity();

    world.addComponent(
      npc,
      new TransformComponent({ name: args.name }),
      new RigidBodyComponent({
        type: 'kinematic',
        initialPosition: args.position ?? new THREE.Vector3(),
        useTerrainHeight: true,
      }),
      new ColliderComponent({ debug: args.debug, size: new THREE.Vector3(1, 1.7, 1) }),
      // make sure the sensor is bigger than the collider above
      new ColliderSensorComponent({ debug: args.debug, size: new THREE.Vector3(1.5, 2, 1.5) }),
      new MeshGlbComponent({
        castShadow: true,
        skeletonMesh: true,
        filename: args.filename ?? 'NpcY.glb',
        name: args.name,
      }),
      new AnimationComponent(),
    );

    return npc;
  }
}
