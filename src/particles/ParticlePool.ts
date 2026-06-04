import * as THREE from 'three';
import { ParticleBatch } from './ParticleBatch';

/**
 * Central registry / manager for all particle batches.
 *
 * Batches are grouped by materialId.
 */
export class ParticlePool {
  private readonly _batches = new Map<string, ParticleBatch>();

  get batches(): Map<string, ParticleBatch> {
    return this._batches;
  }

  constructor(private readonly _scene: THREE.Scene) {}

  /**
   * Returns an existing batch or creates a new one.
   */
  getOrCreateBatch(materialId: string, maxParticles: number, materialFactory: () => THREE.Material): ParticleBatch {
    let batch = this._batches.get(materialId);

    if (batch) {
      return batch;
    }

    const material = materialFactory();

    batch = new ParticleBatch(materialId, maxParticles, material);

    this._scene.add(batch.mesh);

    this._batches.set(materialId, batch);

    return batch;
  }

  /**
   * Returns a batch if it exists.
   */
  getBatch(materialId: string): ParticleBatch | undefined {
    return this._batches.get(materialId);
  }

  /**
   * Checks whether a batch exists.
   */
  hasBatch(materialId: string): boolean {
    return this._batches.has(materialId);
  }

  /**
   * Recounts alive particles for all batches.
   */
  refreshAliveCounts(): void {
    for (const batch of this._batches.values()) {
      batch.refreshAliveCount();
    }
  }

  /**
   * Uploads all particle buffers to GPU.
   */
  upload(): void {
    for (const batch of this._batches.values()) {
      batch.upload();
    }
  }

  /**
   * Total live particles across all batches.
   */
  get totalAliveCount(): number {
    let count = 0;

    for (const batch of this._batches.values()) {
      count += batch.aliveCount;
    }

    return count;
  }

  /**
   * Clears all particles from all batches.
   */
  clear(): void {
    for (const batch of this._batches.values()) {
      for (let i = 0; i < batch.particles.length; i++) {
        batch.particles[i].active = false;
      }

      batch.aliveCount = 0;

      batch.geometry.instanceCount = 0;
    }
  }
}
