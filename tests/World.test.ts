import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../src/ecs/World';
import { Entity } from '../src/ecs/Entity';
import { Component } from '../src/ecs/Component';
import { ComponentNames } from '../src/ecs/ComponentNames';

class TestComponent extends Component {
  get name(): ComponentNames {
    return ComponentNames.Transform;
  }
}

describe('World Class', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  it('should create a new entity', () => {
    const entity = world.createEntity();
    expect(entity).toBeInstanceOf(Entity);
  });

  it('should destroy an entity and remove its components', () => {
    const entity = world.createEntity();
    const component = new TestComponent();
    world.addComponent(entity, component);

    world.destroyEntity(entity);

    expect(world.getComponent(entity, ComponentNames.Transform)).toBeNullable();
  });

  it('should add a component to an entity', () => {
    const entity = world.createEntity();
    const component = new TestComponent();

    world.addComponent(entity, component);

    const retrievedComponent = world.getComponent(entity, ComponentNames.Transform);
    expect(retrievedComponent).toBe(component);
  });

  it('should remove a component from an entity', () => {
    const entity = world.createEntity();
    const component = new TestComponent();
    world.addComponent(entity, component);

    world.removeComponent(entity, ComponentNames.Transform);

    expect(world.getComponent(entity, ComponentNames.Transform)).toBeNullable();
  });

  it('should retrieve all components of a specific type', () => {
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const component1 = new TestComponent();
    const component2 = new TestComponent();

    world.addComponent(entity1, component1);
    world.addComponent(entity2, component2);

    const components = world.getComponents<TestComponent>(ComponentNames.Transform);
    expect(components).toContain(component1);
    expect(components).toContain(component2);
  });
});
