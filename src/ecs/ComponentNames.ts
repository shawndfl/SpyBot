import type { Player } from '../components/Player';
import type { Renderer } from '../components/Renderer';
import type { SunLight } from '../components/SunLight';
import type { Transform } from '../components/Transform';

export interface ComponentTypes {
  Player: Player;
  Renderer: Renderer;
  Transform: Transform;
  SunLight: SunLight;
}

export enum ComponentMask {
  Player = 1,
  Renderer = 1 << 1,
  Transform = 1 << 2,
  SunLight = 1 << 3,
}
