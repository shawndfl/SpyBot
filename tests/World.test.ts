import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../src/ecs/World';
import { Entity } from '../src/ecs/Entity';
import { TransformComponent } from '../src/components/TransformComponent';
import { SunLight } from '../src/components/SunLight';
import { PlayerComponent } from '../src/components/PlayerComponent';
import { Vector3 } from 'three';
import { ComponentRegistry } from '../src/ecs/ComponentRegistry';

describe('World Class', () => {
  let world: World;

  beforeEach(() => {
    world = new World([]);
    ComponentRegistry.register(TransformComponent, SunLight, PlayerComponent);
  });

  it('should create a new entity', () => {
    const entity = world.createEntity();
    expect(entity).toBeInstanceOf(Entity);
  });

  it('should destroy an entity and remove its components', () => {
    const entity = world.createEntity();
    const component = new TransformComponent();
    world.addComponent(entity, component);

    world.destroyEntity(entity);

    expect(world.getComponent(entity, TransformComponent)).toBeNullable();
  });

  it('should add a component to an entity', () => {
    const entity = world.createEntity();
    const component = new PlayerComponent();

    world.addComponent(entity, component);

    const retrievedComponent = world.getComponent(entity, PlayerComponent);
    expect(retrievedComponent).toBe(component);
  });

  it('should remove a component from an entity', () => {
    const entity = world.createEntity();
    const component = new TransformComponent();
    world.addComponent(entity, component);

    world.removeComponent(entity, TransformComponent);

    expect(world.getComponent(entity, TransformComponent)).toBeNullable();
  });

  it('should retrieve all components of a specific type', () => {
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const component1 = new TransformComponent();
    const component2 = new TransformComponent();

    world.addComponent(entity1, component1);
    world.addComponent(entity2, component2);

    const components = world.getComponents(TransformComponent);
    expect(components).toContain(component1);
    expect(components).toContain(component2);
  });

  it('should query different combos', () => {
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const transform1 = new TransformComponent();
    transform1.name = '0';
    const transform2 = new TransformComponent();
    transform2.name = '1';
    const sunlight = new SunLight();
    sunlight.name = '1';

    const pos = [(transform1.position = new Vector3(0, 1, 2)), (transform2.position = new Vector3(4, 5, 6))];
    const sun = [null, (sunlight.ambient = new Vector3(7, 8, 9))];

    world.addComponent(entity1, transform1);
    world.addComponent(entity2, transform2, sunlight);

    for (let [transform] of world.query(TransformComponent)) {
      expect(transform?.mask).toEqual(ComponentRegistry.getId(TransformComponent));
    }

    let i = 0;
    for (let [transform, sunLight] of world.query(TransformComponent, SunLight)) {
      expect(transform?.position).toEqual(pos[parseInt(transform.name!)]);
      expect(sunLight?.ambient).toEqual(sunLight ? sun[parseInt(sunLight.name!)] : null);
    }

    for (let [transform, sunLight, player] of world.query(TransformComponent, SunLight, PlayerComponent)) {
      throw 'should be null';
    }
  });

  it('should get a list of all the components of a TransformComponent Type', () => {
    const entity1 = world.createEntity();
    const entity2 = world.createEntity();
    const transform1 = new TransformComponent();
    transform1.name = '0';
    const transform2 = new TransformComponent();
    transform2.name = '1';
    const sunlight = new SunLight();

    const pos = [(transform1.position = new Vector3(0, 1, 2)), (transform2.position = new Vector3(4, 5, 6))];

    world.addComponent(entity1, transform1);
    world.addComponent(entity2, transform2, sunlight);

    let i = 0;
    for (let transform of world.getComponents(TransformComponent)) {
      expect(transform?.position).toEqual(pos[parseInt(transform.name!)]);
    }
  });
});
