import * as THREE from 'three';
import { System } from '../ecs/System';
import type { UpdateEvent } from '../core/UpdateEvent';
import { TargetingComponent } from '../components/TargetingComponent';
import { TargetComponent } from '../components/TargetComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { Entity } from '../ecs/Entity';

interface TargetCandidate {
  entity: Entity;
  component: TargetComponent;
  root: THREE.Object3D;
  distanceSq: number;
}

export class TargetingSystem extends System {
  private readonly frustum = new THREE.Frustum();
  private readonly projectionView = new THREE.Matrix4();
  private readonly viewCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 25);
  private readonly playerPosition = new THREE.Vector3();
  private readonly playerForward = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();
  private readonly targetPosition = new THREE.Vector3();
  private readonly frustumHelper = new THREE.CameraHelper(this.viewCamera);
  private readonly targetBoundsHelper = new THREE.BoxHelper(new THREE.Object3D(), 0xffcc00);

  constructor(scene: THREE.Scene) {
    super();
    this.frustumHelper.visible = false;
    this.targetBoundsHelper.visible = false;
    scene.add(this.frustumHelper);
    scene.add(this.targetBoundsHelper);
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    const playerResult = world.query(PlayerComponent, TransformComponent).next();

    if (playerResult.done) {
      this.clearTargeting(world);
      return;
    }

    const [, playerTransform] = playerResult.value;
    const candidates: TargetCandidate[] = [];

    for (const [targeting] of world.query(TargetingComponent)) {
      this.updateFrustum(targeting, playerTransform);

      for (const [entity, targetComponent, targetTransform] of world.queryWithEntity(
        TargetComponent,
        TransformComponent,
      )) {
        this.targetPosition.copy(targetTransform.worldPosition);

        if (!this.frustum.containsPoint(this.targetPosition)) {
          continue;
        }

        candidates.push({
          entity,
          component: targetComponent,
          root: targetTransform.root,
          distanceSq: this.targetPosition.distanceToSquared(this.playerPosition),
        });
      }

      candidates.sort((a, b) => a.distanceSq - b.distanceSq);
      targeting.target = candidates[0]?.entity;
      targeting.targetsInView = candidates.map((candidate) => candidate.entity);
      targeting.targetComponentsInView = candidates.map((candidate) => candidate.component);
      this.updateDebugDraw(candidates[0]);
      candidates.length = 0;
    }
  }

  private updateFrustum(targeting: TargetingComponent, playerTransform: TransformComponent): void {
    this.playerPosition.copy(playerTransform.worldPosition);
    this.playerForward.copy(playerTransform.worldDirection).normalize();

    this.viewCamera.fov = THREE.MathUtils.radToDeg(targeting.viewAngle);
    this.viewCamera.far = targeting.viewDistance;
    this.viewCamera.position.copy(this.playerPosition);
    this.viewCamera.lookAt(this.lookTarget.copy(this.playerPosition).add(this.playerForward));
    this.viewCamera.updateProjectionMatrix();
    this.viewCamera.updateMatrixWorld(true);

    this.projectionView.multiplyMatrices(this.viewCamera.projectionMatrix, this.viewCamera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projectionView);
    this.frustumHelper.visible = true;
    this.frustumHelper.update();
  }

  private clearTargeting(world: UpdateEvent['world']): void {
    for (const [targeting] of world.query(TargetingComponent)) {
      targeting.target = undefined;
      targeting.targetsInView = [];
      targeting.targetComponentsInView = [];
    }

    this.frustumHelper.visible = false;
    this.targetBoundsHelper.visible = false;
  }

  private updateDebugDraw(target?: TargetCandidate): void {
    this.targetBoundsHelper.visible = !!target;

    if (!target) {
      return;
    }

    this.targetBoundsHelper.setFromObject(target.root);
    this.targetBoundsHelper.update();
  }
}
