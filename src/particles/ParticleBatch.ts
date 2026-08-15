import * as THREE from 'three';
import type { Particle } from './Particle';

export class ParticleBatch {
  readonly particles: Particle[] = [];

  readonly instancePositions: Float32Array;
  readonly instanceColors: Float32Array;
  readonly instanceAlphas: Float32Array;
  readonly instanceSizes: Float32Array;
  readonly instanceRotations: Float32Array;

  readonly geometry: THREE.InstancedBufferGeometry;
  readonly mesh: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.Material>;

  aliveCount = 0;

  constructor(
    readonly materialId: string,
    readonly maxParticles: number,
    material: THREE.Material,
  ) {
    this.instancePositions = new Float32Array(maxParticles * 3);
    this.instanceColors = new Float32Array(maxParticles * 3);
    this.instanceAlphas = new Float32Array(maxParticles);
    this.instanceSizes = new Float32Array(maxParticles);
    this.instanceRotations = new Float32Array(maxParticles);

    this.geometry = new THREE.InstancedBufferGeometry();

    this.geometry.setIndex([0, 1, 2, 2, 1, 3]);
    this.geometry.setAttribute(
      'quadPosition',
      new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), 2),
    );
    this.geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));

    this.geometry.setAttribute('instancePosition', new THREE.InstancedBufferAttribute(this.instancePositions, 3));
    this.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(this.instanceColors, 3));
    this.geometry.setAttribute('instanceAlpha', new THREE.InstancedBufferAttribute(this.instanceAlphas, 1));
    this.geometry.setAttribute('instanceSize', new THREE.InstancedBufferAttribute(this.instanceSizes, 1));
    this.geometry.setAttribute('instanceRotation', new THREE.InstancedBufferAttribute(this.instanceRotations, 1));
    this.geometry.instanceCount = 0;

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 10;

    // Preallocate particles
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        lifetime: 0,

        gravityY: 0,

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

      this.instancePositions[i3 + 0] = particle.position.x;
      this.instancePositions[i3 + 1] = particle.position.y;
      this.instancePositions[i3 + 2] = particle.position.z;

      this.instanceColors[i3 + 0] = particle.color.r;
      this.instanceColors[i3 + 1] = particle.color.g;
      this.instanceColors[i3 + 2] = particle.color.b;

      this.instanceAlphas[index] = particle.alpha;
      this.instanceSizes[index] = particle.size;
      this.instanceRotations[index] = particle.rotation;

      index++;
    }

    this.geometry.instanceCount = index;

    this.geometry.attributes.instancePosition.needsUpdate = true;
    this.geometry.attributes.instanceColor.needsUpdate = true;
    this.geometry.attributes.instanceAlpha.needsUpdate = true;
    this.geometry.attributes.instanceSize.needsUpdate = true;
    this.geometry.attributes.instanceRotation.needsUpdate = true;
  }
}
