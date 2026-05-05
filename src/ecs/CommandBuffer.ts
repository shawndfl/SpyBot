import type { GameState } from '../core/GameState';
import type { GameStateManager } from '../core/GameStateManager';
import type { TransitionContext } from '../core/TransitionContext';
import type { Component } from './Component';
import type { ComponentCtor } from './ComponentRegistry';
import type { Entity } from './Entity';
import type { World } from './World';

export interface GameWorldCommand {
  world: World;
  worldAction: (world: World) => void;
}

export interface GameStateCommand {
  world: World;
  worldAction: (world: World) => void;
}

export interface TransitionRequest {
  type: 'change' | 'push' | 'pop';
  gameState: GameState;
  context: TransitionContext;
}

export class CommandBuffer {
  protected commands: GameWorldCommand[];
  protected transitionRequest?: TransitionRequest;

  //TODO handle transition

  constructor() {
    this.commands = [];
  }

  requestTransition(transition: TransitionRequest): void {
    this.transitionRequest = transition;
  }

  add(world: World, entity: Entity, component: Component) {
    this.commands.push({ world: world, worldAction: (w: World) => w.addComponent(entity, component) });
  }

  remove(world: World, entity: Entity, componentName: ComponentCtor) {
    this.commands.push({ world: world, worldAction: (w: World) => w.removeComponent(entity, componentName) });
  }

  destroy(world: World, entity: Entity) {
    this.commands.push({ world: world, worldAction: (w: World) => w.destroyEntity(entity) });
  }

  flush(gameState: GameStateManager) {
    for (const cmd of this.commands) {
      cmd.worldAction(cmd.world);
    }

    this.commands.length = 0;
  }

  consumeTransitionRequest(): TransitionRequest {
    const request = this.transitionRequest;
    this.transitionRequest = undefined;
    return request!;
  }
}
