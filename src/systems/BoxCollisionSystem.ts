import * as THREE from 'three';
import { System } from '../ecs/System';
import { TransformComponent } from '../components/TransformComponent';
import { BoxColliderComponent } from '../components/BoxColliderComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { BattleState } from '../gameStates/BattleState';

export class BoxCollisionSystem extends System {
  private _tmpPosition = new THREE.Vector3();

  constructor(componentMask: number, private scene: THREE.Scene) {
    super(componentMask);
  }

  update({ world, commands }: UpdateEvent): void {
    const allColliders = [...world.query(TransformComponent, BoxColliderComponent)];

    for (const [transform, collider] of allColliders) {
      if (collider.debug) {
        if (!collider.debugMesh) {
          collider.debugMesh = this.createDebugMesh(collider);
          this.scene.add(collider.debugMesh);
        }
        collider.debugMesh.position.copy(transform.position).add(collider.offset);
      } else {
        if (collider.debugMesh) {
          this.scene.remove(collider.debugMesh);
        }
      }

      if (!collider.solid && !collider.dynamic) {
        continue;
      }

      if (!this.canMoveTo(transform, collider, transform.position, allColliders)) {
        if (collider.debug) {
          const mat = collider.debugMesh?.material as THREE.LineBasicMaterial;
          mat.color.set(0xff0000);

          // enter a battle

          commands.requestTransition({
            context: {
              battleId: 'openField',
            },
            gameState: new BattleState(),
            type: 'push',
          });
        }
      } else {
        if (collider.debug) {
          const mat = collider.debugMesh?.material as THREE.LineBasicMaterial;
          mat.color.set(0x00ff00);
        }
      }
    }
  }

  private _material = new THREE.LineBasicMaterial({
    color: 0x00ff00,
  });

  private createDebugMesh(collider: BoxColliderComponent): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(collider.size.x, collider.size.y, collider.size.z));

    return new THREE.LineSegments(geometry, this._material);
  }

  private canMoveTo(
    selfTransform: TransformComponent,
    selfCollider: BoxColliderComponent,
    nextPosition: THREE.Vector3,
    allColliders: [TransformComponent, BoxColliderComponent][]
  ): boolean {
    const selfBox = selfCollider.getBox(nextPosition);

    for (const [otherTransform, otherCollider] of allColliders) {
      if (otherTransform === selfTransform) {
        continue;
      }

      if (!otherCollider.solid) {
        continue;
      }

      const otherBox = otherCollider.getBox(otherTransform.position);

      if (selfBox.intersectsBox(otherBox)) {
        return false;
      }
    }

    return true;
  }
}
