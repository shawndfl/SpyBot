import type { Component } from './Component';

import { ComponentRegistry, type ComponentCtor, type ComponentsFromCtors } from './ComponentRegistry';
import { Entity } from './Entity';
import { EntityManager } from './EntityManager';
import type { System } from './System';

/**
 * This class represents the world in an Entity-Component-System (ECS) architecture. It manages entities and their associated components.
 * This is a component centric design, where components are stored in maps keyed by their names, and each component map stores components indexed by entity IDs.
 */
export class World {
  private components = new Map<number, Map<number, Component>>();
  private entityManager: EntityManager = new EntityManager();
  private entityMasks: number[] = [];

  get systems(): Readonly<System[]> {
    return this._systems;
  }

  constructor(private _systems: System[]) {}

  createEntity(): Entity {
    const entity = this.entityManager.create();
    this.entityMasks[entity.id] = 0;
    return entity;
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

  removeComponent(entity: Entity, componentType: ComponentCtor): void {
    if (!entity) {
      return;
    }
    const key = ComponentRegistry.getId(componentType);
    this.entityMasks[entity.id] &= ~key;
    this.components.get(key)?.delete(entity.id);
  }

  addComponent(entity: Entity, ...components: Component[]): void {
    if (!entity || !components) {
      return;
    }
    for (let component of components) {
      const key = component.mask;
      if (!this.components.has(key)) {
        this.components.set(key, new Map<number, Component>());
      }

      this.entityMasks[key] |= component.mask;

      this.components.get(key)!.set(entity.id, component);
    }
    this.updateEntitySystems(entity);
  }

  private updateEntitySystems(entity: Entity) {
    const entityMask = this.entityMasks[entity.id];

    for (const system of this.systems) {
      const matches = (entityMask & system.mask) === system.mask;

      if (matches) {
        system.entities.add(entity);
      } else {
        system.entities.delete(entity);
      }
    }
  }

  getComponent(entity: Entity, componentType: ComponentCtor): Component {
    const key = ComponentRegistry.getId(componentType);
    return this.components.get(key)?.get(entity.id)!;
  }

  /**
   * Query entities that have all specified components.
   * Yields a tuple of components in the order of types provided.
   */
  *query<T extends ComponentCtor[]>(...components: T): Generator<ComponentsFromCtors<T>> {
    const stores = components.map((type) => this.components.get(ComponentRegistry.getId(type)));

    if (stores.some((store) => !store)) {
      return;
    }

    let smallestIndex = 0;
    for (let i = 1; i < stores.length; i++) {
      if (stores[i]!.size < stores[smallestIndex]!.size) {
        smallestIndex = i;
      }
    }

    const smallestStore = stores[smallestIndex]!;

    for (const [entityId] of smallestStore) {
      const tuple = [] as unknown as ComponentsFromCtors<T>;
      let matches = true;

      for (let i = 0; i < stores.length; i++) {
        const component: Component = stores[i]!.get(entityId)! as ComponentsFromCtors<T>[number];

        if (!component) {
          matches = false;
          break;
        }

        tuple[i] = component as ComponentsFromCtors<T>[number];
      }

      if (matches) {
        yield tuple;
      }
    }
  }

  getComponents<T extends Component>(componentType: ComponentCtor<T>): T[] {
    const found: T[] = [];
    const key = ComponentRegistry.getId(componentType);

    for (const component of this.components.get(key)?.values() ?? []) {
      if (component.mask === key) {
        found.push(component as T);
      }
    }

    return found;
  }
}
