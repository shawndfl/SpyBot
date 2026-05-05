import * as THREE from 'three';
import { SmallTownState } from '../gameStates/SmallTownState';
import type { GameState } from './GameState';
import { EmptyGameState } from '../gameStates/EmptyGameState';

export class GamesStateFactory {
  constructor(private _scene: THREE.Scene, private _renderer: THREE.WebGLRenderer) {}

  create(state: string): GameState {
    if (state == 'SmallTown') {
      return new SmallTownState(this._scene, this._renderer);
    }
    return new EmptyGameState();
  }
}
