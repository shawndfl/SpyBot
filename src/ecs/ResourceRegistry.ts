import type { Resource } from './Resource';

export class ResourceRegistry {
  private static ids = new Map<Function, symbol>();

  static getId<T extends typeof Resource>(type: T): symbol {
    let id = this.ids.get(type);
    if (!id) {
      id = Symbol(type.name);
      this.ids.set(type, id);
    }
    return id;
  }
}
