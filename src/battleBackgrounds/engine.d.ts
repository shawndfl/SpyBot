import type BackgroundLayer from './rom/background_layer';

export default class Engine {
  constructor(layers: BackgroundLayer[] = [], opts: any);
  initialize(): void;
  update(dt: number): void;

  layers: BackgroundLayer[];
}
