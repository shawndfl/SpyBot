import type { ComponentNames } from './ComponentNames';

export abstract class Component {
  abstract get name(): ComponentNames;
}
