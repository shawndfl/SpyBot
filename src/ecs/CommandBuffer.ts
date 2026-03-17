import type { Component } from './Component';
import type { ComponentMask } from './ComponentNames';
import type { Entity } from './Entity';
import type { World } from './World';

export class CommandBuffer {
  protected commands: ((world: World) => void)[];

  constructor() {
    this.commands = [];
  }

  add(entity: Entity, component: Component) {
    this.commands.push((w: World) => w.addComponent(entity, component));
  }

  remove(entity: Entity, componentName: ComponentMask) {
    this.commands.push((w: World) => w.removeComponent(entity, componentName));
  }

  destroy(entity: Entity) {
    this.commands.push((w: World) => w.destroyEntity(entity));
  }

  flush(world: World) {
    for (const cmd of this.commands) {
      cmd(world);
    }
    this.commands.length = 0;
  }
}
