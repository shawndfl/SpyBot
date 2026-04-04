import { Entity } from './Entity';

/**
 * manages the creation and destruction of entities in an Entity-Component-System (ECS) architecture.
 * It keeps track of entity generations to ensure that destroyed entities cannot be reused without being recreated,
 * and it maintains a list of free IDs for efficient reuse of entity slots. When an entity is created, it
 * either reuses a free ID or generates a new one. When an entity is destroyed, its generation is incremented to
 * invalidate any existing references to that entity, and its ID is added to the list of free IDs for future reuse.
 * The EntityManager also provides a method to check if an entity is still alive (i.e., has not been destroyed)
 * by comparing the generation of the entity with the current generation stored in the manager.
 */
export class EntityManager {
  generations: number[];
  freeIds: number[];

  constructor() {
    this.generations = [];
    this.freeIds = [];
  }

  create(): Entity {
    let id: number;

    if (this.freeIds.length > 0) {
      id = this.freeIds.pop() || 0;
    } else {
      id = this.generations.length;
      this.generations.push(0);
    }

    return new Entity(id, this.generations[id]);
  }

  getEntity(id: number): Entity {
    return new Entity(id, this.generations[id]);
  }

  destroy(entity: Entity) {
    const { id } = entity;

    this.generations[id]++;
    this.freeIds.push(id);
  }

  isAlive(entity: Entity) {
    return this.generations[entity.id] === entity.generation;
  }
}
