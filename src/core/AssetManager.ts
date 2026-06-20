import { GLTFLoader, type GLTF } from 'three/examples/jsm/Addons.js';
import { AudioLoader } from 'three';

/**
 * Manages async asset requires
 */
export class AssetManager {
  private modelPromises = new Map<string, Promise<GLTF | undefined>>();
  private soundPromises = new Map<string, Promise<AudioBuffer | undefined>>();
  private models = new Map<string, GLTF>();
  private sounds = new Map<string, AudioBuffer>();

  getGlb(path: string): GLTF {
    const model = this.models.get(path);
    if (!model) {
      throw new Error(`GLB has not been loaded: ${path}`);
    }

    return model;
  }

  getSound(path: string): AudioBuffer {
    const sound = this.sounds.get(path);
    if (!sound) {
      throw new Error(`Sound has not been loaded: ${path}`);
    }

    return sound;
  }

  preloadGlb(path: string): Promise<GLTF | undefined> {
    if (this.models.has(path)) {
      return Promise.resolve(this.models.get(path)!);
    }

    if (!this.modelPromises.has(path)) {
      const promise = this.loadGlb(path)
        .then((model) => {
          this.models.set(path, model);
          return model;
        })
        .catch((r: any) => {
          console.error('error loading ' + path);
          return undefined;
        });
      this.modelPromises.set(path, promise);
    }

    return this.modelPromises.get(path)!;
  }

  preloadSound(path: string): Promise<AudioBuffer | undefined> {
    if (this.sounds.has(path)) {
      return Promise.resolve(this.sounds.get(path)!);
    }

    if (!this.soundPromises.has(path)) {
      const promise = this.loadSound(path)
        .then((sound) => {
          this.sounds.set(path, sound);
          return sound;
        })
        .catch((r: any) => {
          console.error('error loading ' + path);
          return undefined;
        });
      this.soundPromises.set(path, promise);
    }

    return this.soundPromises.get(path)!;
  }

  /**
   * Loads a glb object. This includes its animations and sets up the materials.
   * It will also load the first frame of the first animation
   * @param mesh
   * @param path
   * @param animation
   * @returns
   */
  protected async loadGlb(path: string): Promise<GLTF> {
    if (!path) {
      throw new Error('Cannot load a GLB without a path');
    }

    const loader = new GLTFLoader();
    return loader.loadAsync(path);
  }

  protected async loadSound(path: string): Promise<AudioBuffer> {
    if (!path) {
      throw new Error('Cannot load a sound without a path');
    }

    const loader = new AudioLoader();
    return loader.loadAsync(path);
  }
}
