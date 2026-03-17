import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../src/ecs/World';
import { Entity } from '../src/ecs/Entity';
import { Component } from '../src/ecs/Component';
import { ComponentMask } from '../src/ecs/ComponentNames';
import { Transform } from '../src/components/Transform';
import { SunLight } from '../src/components/SunLight';

class TestComponent extends Component {
  id: number = 1;
  get mask(): ComponentMask {
    return 1 << 5;
  }
}

class TestComponent2 extends SunLight {
  id: number = 2;

  get mask(): ComponentMask {
    return ComponentMask.Transform;
  }
}

describe('World Class', () => {
  let world: World;

  beforeEach(() => {
    world = new World([]);
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

    expect(world.getComponent(entity, ComponentMask.Transform)).toBeNullable();
  });

  it('should add a component to an entity', () => {
    const entity = world.createEntity();
    const component = new TestComponent();

    world.addComponent(entity, component);

    const retrievedComponent = world.getComponent(entity, ComponentMask.Transform);
    expect(retrievedComponent).toBe(component);
  });

  it('should remove a component from an entity', () => {
    const entity = world.createEntity();
    const component = new TestComponent();
    world.addComponent(entity, component);

    world.removeComponent(entity, ComponentMask.Transform);

    expect(world.getComponent(entity, ComponentMask.Transform)).toBeNullable();
  });

  it('should retrieve all components of a specific type', () => {
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const component1 = new TestComponent();
    const component2 = new TestComponent();

    world.addComponent(entity1, component1);
    world.addComponent(entity2, component2);

    const components = world.getComponents<TestComponent>(ComponentMask.Transform);
    expect(components).toContain(component1);
    expect(components).toContain(component2);
  });

  it('should query different combos', () => {
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const component1 = new TestComponent();
    const component2 = new TestComponent();
    const component3 = new TestComponent2();

    component1.id = entity1.id;
    component2.id = entity2.id;
    component3.id = entity2.id;

    world.addComponent(entity1, component1);
    world.addComponent(entity2, component2, component3);

    for (let [transform] of world.query(ComponentMask.Transform)) {
      expect(transform?.mask).toEqual(ComponentMask.Transform);
    }

    for (let [Transform, SunLight] of world.query(ComponentMask.Transform, ComponentMask.SunLight)) {
      expect(Transform!.mask).toEqual(ComponentMask.Transform);
      expect(SunLight!.mask).toEqual(ComponentMask.SunLight);
    }

    for (let [Transform, SunLight, Renderer] of world.query(
      ComponentMask.Transform,
      ComponentMask.SunLight,
      ComponentMask.Player
    )) {
      throw 'should be null';
    }
  });
});
