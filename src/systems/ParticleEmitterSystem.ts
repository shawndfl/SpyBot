import * as THREE from 'three';
import { ParticleEmitterComponent } from '../components/particles/ParticleEmitterComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { ParticlePool } from '../particles/ParticlePool';
import { TransformComponent } from '../components/TransformComponent';
import { ParticleEmitterStateComponent } from '../components/particles/ParticleStateComponent';
import type { ParticleBatch } from '../particles/ParticleBatch';
import type { Particle, ParticleInit } from '../particles/Particle';

export class ParticleEmitterSystem extends System {
  private readonly _pool: ParticlePool;
  private readonly _textureLoader = new THREE.TextureLoader();

  private readonly _tempPosition = new THREE.Vector3();
  private readonly _tempVelocity = new THREE.Vector3();

  constructor(private readonly _scene: THREE.Scene) {
    super();
    this._pool = new ParticlePool(this._scene);
  }

  update({ world, dt }: UpdateEvent): void {
    for (const [transform, emitter, state] of world.query(
      TransformComponent,
      ParticleEmitterComponent,
      ParticleEmitterStateComponent,
    )) {
      if (!emitter.playing) {
        continue;
      }

      state.elapsed += dt;

      const batch = this._pool.getOrCreateBatch(emitter.materialId, emitter.maxParticles, () =>
        this.createDefaultMaterial(),
      );

      if (emitter.burstCount > 0 && !state.hasBurstFired) {
        this.spawnParticles(batch, transform, emitter, emitter.burstCount);
        state.hasBurstFired = true;
      }

      if (emitter.emissionRate > 0) {
        state.emitAccumulator += emitter.emissionRate * dt;

        while (state.emitAccumulator >= 1) {
          this.spawnParticles(batch, transform, emitter, 1);
          state.emitAccumulator -= 1;
        }
      }

      if (!emitter.looping && emitter.duration > 0 && state.elapsed >= emitter.duration) {
        emitter.playing = false;
      }
    }

    this.simulate(dt);
    this._pool.refreshAliveCounts();
    this._pool.upload();
  }

  private spawnParticles(
    batch: ParticleBatch,
    transform: TransformComponent,
    emitter: ParticleEmitterComponent,
    count: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const particle = batch.getDeadParticle();

      if (!particle) {
        return;
      }

      const init = this.createParticleInit(transform, emitter);
      this.initializeParticle(particle, init);
    }
  }

  private createParticleInit(transform: TransformComponent, emitter: ParticleEmitterComponent): ParticleInit {
    const lifetime = THREE.MathUtils.randFloat(emitter.lifetimeMin, emitter.lifetimeMax);

    const speed = THREE.MathUtils.randFloat(emitter.speedMin, emitter.speedMax);

    this._tempPosition.copy(transform.position);

    if (emitter.spawnRadius > 0) {
      this._tempPosition.x += THREE.MathUtils.randFloatSpread(emitter.spawnRadius * 2);
      this._tempPosition.y += THREE.MathUtils.randFloatSpread(emitter.spawnRadius * 2);
      this._tempPosition.z += THREE.MathUtils.randFloatSpread(emitter.spawnRadius * 2);
    }
    const velocityX = THREE.MathUtils.randFloat(emitter.minDirection.x, emitter.maxDirection.x);
    const velocityY = THREE.MathUtils.randFloat(emitter.minDirection.y, emitter.maxDirection.y);
    const velocityZ = THREE.MathUtils.randFloat(emitter.minDirection.z, emitter.maxDirection.z);
    this._tempVelocity.set(velocityX, velocityY, velocityZ).normalize().multiplyScalar(speed);

    return {
      lifetime,

      gravityY: emitter.gravity.y,

      position: this._tempPosition,
      velocity: this._tempVelocity,

      sizeStart: emitter.sizeStart,
      sizeEnd: emitter.sizeEnd,

      colorStart: emitter.colorStart,
      colorEnd: emitter.colorEnd,

      alphaStart: emitter.alphaStart,
      alphaEnd: emitter.alphaEnd,

      rotationStart: THREE.MathUtils.randFloat(0, Math.PI * 2),
      angularVelocity: THREE.MathUtils.randFloat(-2, 2),
    };
  }

  private initializeParticle(particle: Particle, init: ParticleInit): void {
    particle.active = true;

    particle.age = 0;
    particle.lifetime = init.lifetime;

    particle.position.copy(init.position);
    particle.velocity.copy(init.velocity);

    particle.sizeStart = init.sizeStart;
    particle.sizeEnd = init.sizeEnd;
    particle.size = init.sizeStart;

    particle.colorStart.copy(init.colorStart);
    particle.colorEnd.copy(init.colorEnd);
    particle.color.copy(init.colorStart);

    particle.alphaStart = init.alphaStart;
    particle.alphaEnd = init.alphaEnd;
    particle.alpha = init.alphaStart;

    particle.rotation = init.rotationStart;
    particle.angularVelocity = init.angularVelocity;
  }

  /**
   * Simulate each particle
   * @param dt
   */
  private simulate(dt: number): void {
    for (const [, batch] of this._pool.batches) {
      for (const particle of batch.particles) {
        if (!particle.active) {
          continue;
        }

        particle.age += dt;

        if (particle.age >= particle.lifetime) {
          particle.active = false;
          batch.aliveCount--;
          continue;
        }

        const t = particle.age / particle.lifetime;

        particle.velocity.y += particle.gravityY * dt;

        particle.position.addScaledVector(particle.velocity, dt);

        particle.size = THREE.MathUtils.lerp(particle.sizeStart, particle.sizeEnd, t);

        particle.color.lerpColors(particle.colorStart, particle.colorEnd, t);

        particle.alpha = THREE.MathUtils.lerp(particle.alphaStart, particle.alphaEnd, t);

        particle.rotation += particle.angularVelocity * dt;
      }
    }
  }

  private createDefaultMaterial(): THREE.Material {
    const texture = this._textureLoader.load('/particle-soft-circle.png');

    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
      },
      vertexShader: `
        attribute vec2 quadPosition;
        attribute vec3 instancePosition;
        attribute vec3 instanceColor;
        attribute float instanceAlpha;
        attribute float instanceSize;
        attribute float instanceRotation;

        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          float angleSin = sin(instanceRotation);
          float angleCos = cos(instanceRotation);
          vec2 rotatedPosition = vec2(
            quadPosition.x * angleCos - quadPosition.y * angleSin,
            quadPosition.x * angleSin + quadPosition.y * angleCos
          ) * instanceSize;

          vec4 viewPosition = modelViewMatrix * vec4(instancePosition, 1.0);
          viewPosition.xy += rotatedPosition;

          vUv = uv;
          vColor = instanceColor;
          vAlpha = instanceAlpha;

          gl_Position = projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;

        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 textureColor = texture2D(map, vUv);
          float alpha = textureColor.a * vAlpha;

          if (alpha <= 0.001) {
            discard;
          }

          gl_FragColor = vec4(textureColor.rgb * vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }
}
