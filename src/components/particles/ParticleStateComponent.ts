import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

/**
 * The state of this is managed by the ParticleEmitterSystem
 */
export class ParticleEmitterStateComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(ParticleEmitterStateComponent);
  }

  emitAccumulator = 0;
  elapsed = 0;
  hasBurstFired = false;
}
