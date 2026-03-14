import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager } from '../src/ecs/EntityManager';
import { Entity } from '../src/ecs/Entity';

describe('EntityManager Class', () => {
  let entityManager: EntityManager;

  beforeEach(() => {
    entityManager = new EntityManager();
  });

  it('should create a new entity with a unique ID and generation', () => {
    const entity = entityManager.create();
    expect(entity).toBeInstanceOf(Entity);
    expect(entity.id).toBe(0);
    expect(entity.generation).toBe(0);

    const anotherEntity = entityManager.create();
    expect(anotherEntity.id).toBe(1);
    expect(anotherEntity.generation).toBe(0);
  });

  it('should reuse IDs of destroyed entities with incremented generation', () => {
    const entity = entityManager.create();
    entityManager.destroy(entity);

    const reusedEntity = entityManager.create();
    expect(reusedEntity.id).toBe(entity.id);
    expect(reusedEntity.generation).toBe(entity.generation + 1);
  });

  it('should correctly mark an entity as destroyed', () => {
    const entity = entityManager.create();
    expect(entityManager.isAlive(entity)).toBe(true);

    entityManager.destroy(entity);
    expect(entityManager.isAlive(entity)).toBe(false);
  });

  it('should not mark an entity as alive if the generation does not match', () => {
    const entity = entityManager.create();
    entityManager.destroy(entity);

    const newEntity = entityManager.create();
    expect(entityManager.isAlive(entity)).toBe(false);
    expect(entityManager.isAlive(newEntity)).toBe(true);
  });
});
