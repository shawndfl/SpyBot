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
import { TerrainComponent } from '../components/mesh/TerrainComponent';

type ColliderState = {
  id: RAPIER.ColliderHandle;
  isKinematic: boolean;
  isSensor: boolean;
};

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

  private colliderStateByHandle = new Map<RAPIER.ColliderHandle, ColliderState>();

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
    for (const [entity, rigidBody, colliderCom] of world.queryWithEntity(RigidBodyComponent, ColliderComponent)) {
      // create rigid body
      if (!rigidBody.body) {
        const desc =
          rigidBody.type === 'dynamic'
            ? RAPIER.RigidBodyDesc.dynamic()
            : rigidBody.type === 'fixed'
              ? RAPIER.RigidBodyDesc.fixed()
              : RAPIER.RigidBodyDesc.kinematicPositionBased();

        const initialPosition = rigidBody.initialPosition || { x: 0, y: 0, z: 0 };
        const [[initialHeight]] = world.query(TerrainComponent);
        if (initialHeight) {
          initialPosition.y = initialHeight.getHeight?.(initialPosition.x, initialPosition.z) ?? 0;
        }
        desc.setTranslation(initialPosition.x, initialPosition.y, initialPosition.z);

        rigidBody.body = this.physics.world.createRigidBody(desc);
        rigidBody.body.setRotation(rigidBody.initialRotation || { x: 0, y: 0, z: 0, w: 1 }, false);
        rigidBody.body.setNextKinematicTranslation(initialPosition);
        rigidBody.body.setNextKinematicRotation(rigidBody.initialRotation || { x: 0, y: 0, z: 0, w: 1 });
      }

      // create collider
      if (!colliderCom.collider && rigidBody.body) {
        let desc: RAPIER.ColliderDesc;

        if (colliderCom.shape === 'box') {
          desc = RAPIER.ColliderDesc.cuboid(colliderCom.size.x / 2, colliderCom.size.y / 2, colliderCom.size.z / 2);
        } else if (colliderCom.shape === 'sphere') {
          desc = RAPIER.ColliderDesc.ball(colliderCom.size.x / 2);
        } else {
          desc = RAPIER.ColliderDesc.capsule(colliderCom.size.y / 2, colliderCom.size.x / 2);
        }

        desc.setSensor(colliderCom.isSensor);
        desc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        // need when all triggers are kinematic, at least one needs to be dynamic
        desc.setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL);

        colliderCom.collider = this.physics.world.createCollider(desc, rigidBody.body);

        // need to keep track of the state so that this can be queried
        // from computeColliderMovement and not get a rust exception thrown
        const id = colliderCom.collider.handle;
        this.colliderStateByHandle.set(id, {
          id: id,
          isKinematic: colliderCom.collider.parent()?.isKinematic()!,
          isSensor: colliderCom.collider.isSensor(),
        });

        // map the handle to the entity
        this.colliderHandleToEntity.set(colliderCom.collider?.handle, entity);
      }

      // create player controller
      if (rigidBody.requestPlayerController && colliderCom.collider && rigidBody.body) {
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

        // Character movement. We do not want to collide with things
        // that are kinematic sensors. We just want to run through them
        // and trigger events in EntityTriggerDispatchSystem
        rigidBody.playerController.computeColliderMovement(
          colliderCom.collider!,
          this.desiredMovement,
          undefined, //RAPIER.QueryFilterFlags.EXCLUDE_KINEMATIC,
          undefined,
          (c) => {
            const data = this.colliderStateByHandle.get(c.handle);
            if (data) {
              const isKinematic = data.isKinematic;
              if (isKinematic) {
                return !data.isSensor;
              }
            }
            return true;
          },
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
