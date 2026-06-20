import * as THREE from 'three';
import type { World } from '../ecs/World';
import { ParticleEmitterComponent } from '../components/particles/ParticleEmitterComponent';
import { ParticleEmitterStateComponent } from '../components/particles/ParticleStateComponent';
import { TransformComponent } from '../components/TransformComponent';
import { BattleTriggerComponent } from '../components/BattleTriggerComponent';
import { ColliderComponent } from '../components/physics/ColliderComponent';
import { RigidBody } from '@dimforge/rapier3d-compat';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';

export interface EnemySpawnFactoryArgs {
  position: THREE.Vector3;
  debug?: boolean;
}

export class EnemySpawnFactory {
  static knightEnemy(world: World, args: EnemySpawnFactoryArgs): void {
    const position = args.position ?? new THREE.Vector3();

    // battle boxCollider
    const portalBox = world.createEntity();
    world.addComponent(
      portalBox,
      new ColliderComponent({
        size: new THREE.Vector3(1, 1, 1),
        debug: args.debug,
        isSensor: true,
      }),
      new RigidBodyComponent({ type: 'kinematic', initialPosition: position, name: 'enemySpawn' }),
      new ParticleEmitterComponent({
        speedMin: 5.0,
        speedMax: 7.0,
        alphaStart: 1,
        alphaEnd: 0.8,
        minDirection: new THREE.Vector3(-0.05, 1, 0.05),
        maxDirection: new THREE.Vector3(-0.05, 1, 0.05),
        colorStart: new THREE.Color(0, 0, 1),
        colorEnd: new THREE.Color(1, 1, 0),
        emissionRate: 80,
        sizeStart: 0.1,
        sizeEnd: 0.5,
        burstCount: 10,
        lifetimeMin: 0.5,
        lifetimeMax: 0.5,
      }),
      new ParticleEmitterStateComponent(),
      new TransformComponent({ name: 'enemy' }),
      new BattleTriggerComponent({
        context: {
          battleId: 'openField',
        },
      }),
    );
  }
}
