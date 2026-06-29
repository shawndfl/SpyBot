import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';
import type { Entity } from '../ecs/Entity';
import type { TargetComponent } from './TargetComponent';

/**
 * This is a template component. It has the mask
 * and a constructor with a partial init argument.
 */
export class TargetingComponent extends Component {
  target?: Entity;
  targetsInView: Entity[] = [];
  targetComponentsInView: TargetComponent[] = [];
  viewAngle = Math.PI / 4;
  viewDistance = 25;

  get mask(): number {
    return ComponentRegistry.getId(TargetingComponent);
  }

  constructor(init?: Partial<TargetingComponent>) {
    super();
    Object.assign(this, init);
  }
}
