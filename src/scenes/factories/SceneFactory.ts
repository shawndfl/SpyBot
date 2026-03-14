import type { GameScene } from '../GameScene';
import { SmallTownScene } from '../SmallTownScene';

export class SceneFactory {
  createScene(type: string): GameScene {
    switch (type) {
      case 'smallTown':
        return new SmallTownScene();
      default:
        return new SmallTownScene();
    }
  }
}
