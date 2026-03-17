import type { ComponentMask } from './ComponentNames';

export abstract class Component {
  abstract get mask(): ComponentMask;
}
