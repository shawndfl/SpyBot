import type { Resource } from './Resource';
import { ResourceRegistry } from './ResourceRegistry';

/**
 * The resource manager manages single resource like:
 *      renderer config
 *      scene environment
 *      input state
 *      current level data
 *      physics world
 *      asset cache
 *      active camera reference
 */
export class ResourceManager {
  private resources = new Map<symbol, Resource>();

  addResource<T extends Resource>(resource: T): void {
    const key = ResourceRegistry.getId(resource.constructor as typeof Resource);
    this.resources.set(key, resource);
  }

  getResource<T extends Resource>(type: new (...args: any[]) => T): T {
    const key = ResourceRegistry.getId(type as unknown as typeof Resource);
    const resource = this.resources.get(key);
    if (!resource) {
      throw new Error(`Resource not found: ${type.name}`);
    }
    return resource as T;
  }

  hasResource<T extends Resource>(type: new (...args: any[]) => T): boolean {
    const key = ResourceRegistry.getId(type as unknown as typeof Resource);
    return this.resources.has(key);
  }
}
