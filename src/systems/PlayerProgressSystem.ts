import * as THREE from 'three';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { PlayerProgressResource } from '../procedural/resources/PlayerProgressResource';

export class PlayerProgressSystem extends System {
  private readonly lastSavedPosition = new THREE.Vector3();
  private initialized = false;
  private elapsedSinceSave = 0;

  constructor(private readonly saveInterval = 1) {
    super();
  }

  update({ world, dt }: UpdateEvent): void {
    if (!world.resources.hasResource(PlayerProgressResource)) {
      return;
    }

    const playerResult = world.query(PlayerComponent, TransformComponent).next();
    if (playerResult.done) {
      return;
    }

    const [, transform] = playerResult.value;
    const progress = world.resources.getResource(PlayerProgressResource);
    if (!this.initialized) {
      this.lastSavedPosition.copy(progress.playerPosition);
      this.initialized = true;
    }

    progress.updatePlayerPosition(transform.position);
    this.elapsedSinceSave += dt;
    if (this.elapsedSinceSave < this.saveInterval || this.lastSavedPosition.equals(progress.playerPosition)) {
      return;
    }

    progress.save();
    this.lastSavedPosition.copy(progress.playerPosition);
    this.elapsedSinceSave = 0;
  }
}
