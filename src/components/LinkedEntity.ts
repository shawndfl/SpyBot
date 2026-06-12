import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';
import type { Entity } from '../ecs/Entity';

export class LinkedEntity extends Component {
  get mask(): number {
    return ComponentRegistry.getId(LinkedEntity);
  }

  entity!: Entity;

  constructor(init?: Partial<LinkedEntity>) {
    super();
    Object.assign(this, init);
  }
}
