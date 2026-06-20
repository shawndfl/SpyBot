import type { TransitionRequest } from '../ecs/CommandBuffer';

export interface LoadingManifest {
  physics: boolean;
  glbs: string[];
  sounds: string[];
  textures: string[];
}

export interface TransitionContext {
  /**
   * For loading a battle scene
   */
  battleId?: string;

  /**
   * If we want to load assets
   */
  assetManifest?: LoadingManifest;

  /**
   * where to go after the loading screen
   */
  nextStateAfterLoading?: TransitionRequest;
}
