import * as THREE from 'three';
import type { World } from '../ecs/World';

/**
 * The GameScene class represents a specific scene or level in the game.
 * It is responsible for creating and setting up the world for that scene,
 * including adding entities, components, and systems as needed.
 */
export abstract class GameScene {
  abstract create(world: World, scene: THREE.Scene, renderer: THREE.WebGLRenderer): World;
}
