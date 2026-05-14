import * as THREE from 'three';
import { SmallTownState } from '../gameStates/SmallTownState';
import type { GameState } from './GameState';
import { EmptyGameState } from '../gameStates/EmptyGameState';

export class GamesStateFactory {
  constructor() {}

  create(state: string): GameState {
    if (state == 'SmallTown') {
      return new SmallTownState();
    }
    return new EmptyGameState();
  }
}
