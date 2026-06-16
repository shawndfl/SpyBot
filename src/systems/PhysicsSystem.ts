import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { System } from '../ecs/System';
import { PhysicsContext } from '../core/PhysiscContext';
import type { UpdateEvent } from '../core/UpdateEvent';
import { TransformComponent } from '../components/TransformComponent';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';
import { ColliderComponent } from '../components/physics/ColliderComponent';
import type { Entity } from '../ecs/Entity';
import { EntityTriggerEvent } from '../events/EntityTriggerEvent';
import type { Scene } from 'three';

/**
 * Manages the rapier physics engine
 */
export class PhysicsSystem extends System {
  /**
   *
   */
  private colliderHandleToEntity = new Map<RAPIER.ColliderHandle, Entity>();

  constructor(
    private scene: Scene,
    private physics: PhysicsContext,
  ) {
    super();
  }

  update({ world, dt, events }: UpdateEvent): void {
    if (!this.physics.isReady) {
      return;
    }
    for (const [entity, transform, rigidBody, collider] of world.queryWithEntity(
      TransformComponent,
      RigidBodyComponent,
      ColliderComponent,
    )) {
      // create rigid body
      if (!rigidBody.body) {
        const desc =
          rigidBody.type === 'dynamic'
            ? RAPIER.RigidBodyDesc.dynamic()
            : rigidBody.type === 'fixed'
              ? RAPIER.RigidBodyDesc.fixed()
              : RAPIER.RigidBodyDesc.kinematicPositionBased();

        desc.setTranslation(transform.position.x, transform.position.y, transform.position.z);

        rigidBody.body = this.physics.world.createRigidBody(desc);
      }

      // create collider
      if (!collider.collider && rigidBody.body) {
        let desc: RAPIER.ColliderDesc;

        if (collider.shape === 'box') {
          desc = RAPIER.ColliderDesc.cuboid(collider.size.x / 2, collider.size.y / 2, collider.size.z / 2);
        } else if (collider.shape === 'sphere') {
          desc = RAPIER.ColliderDesc.ball(collider.size.x / 2);
        } else {
          desc = RAPIER.ColliderDesc.capsule(collider.size.y / 2, collider.size.x / 2);
        }

        desc.setSensor(collider.isSensor);
        desc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

        collider.collider = this.physics.world.createCollider(desc, rigidBody.body);

        // map the handle to the entity
        this.colliderHandleToEntity.set(collider.collider?.handle, entity);
      }

      // debug the colliders
      if (collider.debug) {
        if (!collider.debugMesh) {
          collider.debugMesh = this.createDebugMesh(collider);
          this.scene.add(collider.debugMesh);
        }
        // update debug mesh position
        collider.debugMesh.position.copy(transform.worldPosition);
      }
    }

    this.physics.eventQueue.drainCollisionEvents((h1, h2, started) => {
      const entityA = this.colliderHandleToEntity.get(h1)!;
      const entityB = this.colliderHandleToEntity.get(h2)!;

      events.emit(new EntityTriggerEvent(started ? 'trigger-enter' : 'trigger-exit', entityA, entityB));
    });

    this.physics.step(dt);
  }

  private _material = new THREE.LineBasicMaterial({
    color: 0x00ff00,
  });

  private createDebugMesh(collider: ColliderComponent): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(collider.size.x, collider.size.y, collider.size.z));

    return new THREE.LineSegments(geometry, this._material);
  }
}
