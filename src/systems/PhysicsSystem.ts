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
  private desiredMovement = new THREE.Vector3();
  private correctedPosition = new THREE.Vector3();

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
        rigidBody.body.setTranslation(rigidBody.initialPosition || { x: 0, y: 0, z: 0 }, false);
        rigidBody.body.setRotation(rigidBody.initialRotation || { x: 0, y: 0, z: 0, w: 1 }, false);
        rigidBody.body.setNextKinematicTranslation(rigidBody.initialPosition || { x: 0, y: 0, z: 0 });
        rigidBody.body.setNextKinematicRotation(rigidBody.initialRotation || { x: 0, y: 0, z: 0, w: 1 });
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
        // need when all triggers are kinematic, at least one needs to be dynamic
        desc.setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL);

        collider.collider = this.physics.world.createCollider(desc, rigidBody.body);

        // map the handle to the entity
        this.colliderHandleToEntity.set(collider.collider?.handle, entity);
      }

      // create player controller
      if (rigidBody.requestPlayerController && collider.collider && rigidBody.body) {
        if (!rigidBody.playerController) {
          rigidBody.playerController = this.physics.world.createCharacterController(0.01);
        }

        const currentTranslation = rigidBody.body.translation();
        const nextTranslation = rigidBody.body.nextTranslation();
        this.desiredMovement.set(
          nextTranslation.x - currentTranslation.x,
          nextTranslation.y - currentTranslation.y,
          nextTranslation.z - currentTranslation.z,
        );
        rigidBody.playerController.computeColliderMovement(
          collider.collider,
          this.desiredMovement,
          RAPIER.QueryFilterFlags.EXCLUDE_KINEMATIC,
        );

        const correctedMovement = rigidBody.playerController.computedMovement();
        this.correctedPosition.set(
          currentTranslation.x + correctedMovement.x,
          currentTranslation.y + correctedMovement.y,
          currentTranslation.z + correctedMovement.z,
        );
        rigidBody.body.setNextKinematicTranslation(this.correctedPosition);
      }
    }

    this.physics.step(dt);

    for (const [transform, rigidBody, collider] of world.query(
      TransformComponent,
      RigidBodyComponent,
      ColliderComponent,
    )) {
      if (!rigidBody.body) {
        continue;
      }

      const position = rigidBody.body.translation();
      const rotation = rigidBody.body.rotation();

      transform.position.set(position.x, position.y, position.z);
      transform.root.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      transform.root.updateMatrixWorld(true);

      // debug the colliders
      if (collider.debug) {
        if (!collider.debugMesh) {
          collider.debugMesh = this.createDebugMesh(collider);
          this.scene.add(collider.debugMesh);
        }

        collider.debugMesh.position.copy(transform.worldPosition);
        collider.debugMesh.quaternion.copy(transform.worldRotation);
      }
    }

    this.physics.eventQueue.drainCollisionEvents((h1, h2, started) => {
      const entityA = this.colliderHandleToEntity.get(h1)!;
      const entityB = this.colliderHandleToEntity.get(h2)!;

      events.emit(new EntityTriggerEvent(started ? 'trigger-enter' : 'trigger-exit', entityA, entityB));
    });
  }

  private _material = new THREE.LineBasicMaterial({
    color: 0x00ff00,
  });

  private createDebugMesh(collider: ColliderComponent): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(collider.size.x, collider.size.y, collider.size.z));

    return new THREE.LineSegments(geometry, this._material);
  }
}
