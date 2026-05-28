import * as THREE from 'three';
import type { Particle } from './Particle';

export class ParticleBatch {
  readonly particles: Particle[] = [];

  readonly positions: Float32Array;
  readonly colors: Float32Array;
  readonly sizes: Float32Array;

  readonly geometry: THREE.BufferGeometry;
  readonly points: THREE.Points;

  aliveCount = 0;

  constructor(readonly materialId: string, readonly maxParticles: number, material: THREE.Material) {
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.sizes = new Float32Array(maxParticles);

    this.geometry = new THREE.BufferGeometry();

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    this.points = new THREE.Points(this.geometry, material);
    this.points.renderOrder = 10;

    // Preallocate particles
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        lifetime: 0,

        gravityY: -9.8,

        rotation: 0,
        angularVelocity: 0,

        age: 0,

        size: 0,
        alpha: 0,
        color: new THREE.Color(),

        rotationStart: 0,

        alphaEnd: 0,
        alphaStart: 1,

        sizeStart: 1,
        sizeEnd: 1,

        colorStart: new THREE.Color(),
        colorEnd: new THREE.Color(),
      });
    }
  }

  /**
   * Returns a free particle if available.
   */
  getDeadParticle(): Particle | undefined {
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (!particle.active) {
        particle.active = true;
        this.aliveCount++;

        return particle;
      }
    }

    return undefined;
  }

  /**
   * Recounts alive particles.
   * Useful as a validation pass.
   */
  refreshAliveCount(): void {
    let count = 0;

    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active) {
        count++;
      }
    }

    this.aliveCount = count;
  }

  /**
   * Removes dead particles from render buffers
   * and uploads live particle data to the GPU.
   */
  upload(): void {
    let index = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (!particle.active) {
        continue;
      }

      const i3 = index * 3;

      this.positions[i3 + 0] = particle.position.x;
      this.positions[i3 + 1] = particle.position.y;
      this.positions[i3 + 2] = particle.position.z;

      this.colors[i3 + 0] = particle.color.r;
      this.colors[i3 + 1] = particle.color.g;
      this.colors[i3 + 2] = particle.color.b;

      this.sizes[index] = particle.size;

      index++;
    }

    this.geometry.setDrawRange(0, index);

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }
}
