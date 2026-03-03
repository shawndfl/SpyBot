import type { Engine } from './Engine';

export abstract class System {
  update(engine: Engine, delta: number): void {}
}
