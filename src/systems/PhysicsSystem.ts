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
import type { World } from '../ecs/World';
import { ColliderSensorComponent } from '../components/physics/ColliderSensorComponent';
import { TerrainHeightResource } from '../procedural/resources/TerrainHeightResource';

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

    // handle sensor colliders
    for (const [entity, rigidBody, sensorCollider] of world.queryWithEntity(
      RigidBodyComponent,
      ColliderSensorComponent,
    )) {
      // create rigid body
      this.createRigidBody(rigidBody, world);

      this.createCollider(entity, sensorCollider, rigidBody);

      // create player controller
      if (rigidBody.requestPlayerController && sensorCollider.collider && rigidBody.body) {
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
          sensorCollider.collider!,
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

    // handle normal colliders
    for (const [entity, rigidBody, colliderCom] of world.queryWithEntity(RigidBodyComponent, ColliderComponent)) {
      // create rigid body
      this.createRigidBody(rigidBody, world);

      this.createCollider(entity, colliderCom, rigidBody);
    }

    // physics step
    this.physics.step(dt);

    // sync transform
    for (const [entity, transform, rigidBody] of world.queryWithEntity(TransformComponent, RigidBodyComponent)) {
      if (!rigidBody.body) {
        continue;
      }

      const position = rigidBody.body.translation();
      const rotation = rigidBody.body.rotation();

      transform.position.set(position.x, position.y, position.z);
      transform.root.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      transform.root.updateMatrixWorld(true);

      const colliders = [
        world.getComponent(entity, ColliderComponent),
        world.getComponent(entity, ColliderSensorComponent),
      ].filter((x) => !!x);

      for (let collider of colliders) {
        // debug the colliders
        if (collider.debug) {
          if (!collider.debugMesh) {
            collider.debugMesh = this.createDebugMesh(collider, collider.isSensor);
            this.scene.add(collider.debugMesh);
          }

          collider.debugMesh.position.copy(collider.collider!.translation());
          collider.debugMesh.quaternion.copy(transform.worldRotation);
        }
      }
    }

    // dispatch sensor events
    this.physics.eventQueue.drainCollisionEvents((h1, h2, started) => {
      const entityA = this.colliderHandleToEntity.get(h1)!;
      const entityB = this.colliderHandleToEntity.get(h2)!;

      events.emit(new EntityTriggerEvent(started ? 'trigger-enter' : 'trigger-exit', entityA, entityB));
    });
  }

  private createCollider(entity: Entity, colliderCom: ColliderComponent, rigidBody: RigidBodyComponent): void {
    // create collider
    if (!colliderCom.collider && rigidBody.body) {
      let desc: RAPIER.ColliderDesc;

      if (colliderCom.shape === 'box') {
        desc = RAPIER.ColliderDesc.cuboid(colliderCom.size.x / 2, colliderCom.size.y / 2, colliderCom.size.z / 2);
        desc.setTranslation(0, colliderCom.size.y / 2, 0);
      } else if (colliderCom.shape === 'sphere') {
        desc = RAPIER.ColliderDesc.ball(colliderCom.size.x / 2);
        desc.setTranslation(0, colliderCom.size.x / 2, 0);
      } else {
        desc = RAPIER.ColliderDesc.capsule(colliderCom.size.y / 2, colliderCom.size.x / 2);
        desc.setTranslation(0, colliderCom.size.y / 2, 0);
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
  }

  private createRigidBody(rigidBody: RigidBodyComponent, world: World): void {
    if (!rigidBody.body) {
      const desc =
        rigidBody.type === 'dynamic'
          ? RAPIER.RigidBodyDesc.dynamic()
          : rigidBody.type === 'fixed'
            ? RAPIER.RigidBodyDesc.fixed()
            : RAPIER.RigidBodyDesc.kinematicPositionBased();

      const initialPosition = rigidBody.initialPosition || { x: 0, y: 0, z: 0 };
      if (world.resources.hasResource(TerrainHeightResource)) {
        const terrain = world.resources.getResource(TerrainHeightResource);
        initialPosition.y = terrain.getHeight(initialPosition.x, initialPosition.z);
      }
      desc.setTranslation(initialPosition.x, initialPosition.y, initialPosition.z);

      rigidBody.body = this.physics.world.createRigidBody(desc);
      rigidBody.body.setRotation(rigidBody.initialRotation || { x: 0, y: 0, z: 0, w: 1 }, false);
      rigidBody.body.setNextKinematicTranslation(initialPosition);
      rigidBody.body.setNextKinematicRotation(rigidBody.initialRotation || { x: 0, y: 0, z: 0, w: 1 });
    }
  }

  private _colliderMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00,
  });

  private _sensorMaterial = new THREE.LineBasicMaterial({
    color: 0xffff00,
  });

  private createDebugMesh(collider: ColliderComponent, isSensor: boolean): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(collider.size.x, collider.size.y, collider.size.z));

    return new THREE.LineSegments(geometry, isSensor ? this._sensorMaterial : this._colliderMaterial);
  }
}
