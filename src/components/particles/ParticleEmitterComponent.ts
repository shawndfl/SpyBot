import * as THREE from 'three';
import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';
import type { ParticleBatch } from '../../particles/ParticleBatch';

export class ParticleEmitterComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(ParticleEmitterComponent);
  }

  maxParticles = 200;
  emissionRate = 30; // per second
  duration = -1; // -1 = looping forever
  looping = true;
  playing = true;

  lifetimeMin = 0.4;
  lifetimeMax = 1.2;

  speedMin = 1;
  speedMax = 3;

  sizeStart = 0.2;
  sizeEnd = 0.0;

  alphaStart: number = 1.0;
  alphaEnd: number = 0.5;

  minDirection = new THREE.Vector3();
  maxDirection = new THREE.Vector3();

  colorStart = new THREE.Color(1, 0.8, 0.2);
  colorEnd = new THREE.Color(0.2, 0.2, 0.2);

  gravity = new THREE.Vector3(0, -9.8, 0);

  spawnRadius = 0.1;
  worldSpace = true;

  burstCount = 0; // optional one-shot burst
  materialId = 'smoke';

  /**
   * The Particle system will manage this.
   */
  particleBatch?: ParticleBatch;

  constructor(init?: Partial<ParticleEmitterComponent>) {
    super();
    Object.assign(this, init);
  }
}
