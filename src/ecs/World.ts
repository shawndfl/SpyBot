import type { Component } from './Component';
import { ComponentNames } from './ComponentNames';
import { Entity } from './Entity';
import { EntityManager } from './EntityManager';

/**
 * This class represents the world in an Entity-Component-System (ECS) architecture. It manages entities and their associated components.
 * This is a component centric design, where components are stored in maps keyed by their names, and each component map stores components indexed by entity IDs.
 */
export class World {
  private components = new Map<string, Map<number, Component>>();
  private entityManager: EntityManager = new EntityManager();

  createEntity(): Entity {
    return this.entityManager.create();
  }

  destroyEntity(entity: Entity) {
    if (!this.entityManager.isAlive(entity)) {
      return;
    }

    // Remove all components for this entity ID
    for (const componentMap of this.components.values()) {
      componentMap.delete(entity.id);
    }

    this.entityManager.destroy(entity);
  }

  removeComponent(entity: Entity, componentName: ComponentNames): void {
    if (!entity) {
      return;
    }
    const key = componentName;
    this.components.get(key)?.delete(entity.id);
  }

  addComponent(entity: Entity, component: Component): void {
    if (!entity || !component) {
      return;
    }
    const key = component.name;
    if (!this.components.has(key)) {
      this.components.set(key, new Map<number, Component>());
    }

    this.components.get(key)!.set(entity.id, component);
  }

  getComponent(entity: Entity, componentName: ComponentNames): Component {
    return this.components.get(componentName)?.get(entity.id)!;
  }

  getComponents<T>(componentName: ComponentNames): T[] {
    const components = [];
    for (let component of this.components.get(componentName)?.values() || []) {
      if (component.name === componentName) {
        components.push(component);
      }
    }
    return components as T[];
  }
}
