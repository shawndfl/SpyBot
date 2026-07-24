import type { Component } from './Component';

export type ComponentCtor<T extends Component = Component> = new (...args: any[]) => T;

export type ComponentsFromCtors<T extends ComponentCtor[]> = {
  [K in keyof T]: T[K] extends ComponentCtor<infer C> ? C : never;
};

export type ComponentFromCtor<T extends ComponentCtor> = T extends ComponentCtor<infer C> ? C : never;

export class ComponentRegistry {
  private static ids = new Map<ComponentCtor, number>();
  private static nextId = 0;

  static getId(ctor: ComponentCtor): number {
    if (!this.ids.has(ctor)) {
      this.register(ctor);
      //throw 'Unknown Component: ' + ctor;
    }

    return this.ids.get(ctor)!;
  }

  static register(...ctors: ComponentCtor[]): void {
    for (let ctor of ctors) {
      if (!this.ids.has(ctor)) {
        const id = this.nextId++;
        console.debug('registering ' + ctor.name + ' at ' + id);
        this.ids.set(ctor, id);
      }
    }
  }
}
