import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/Addons.js';
import { AudioLoader } from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * Manages async asset requires
 */
export class AssetManager {
  private modelPromises = new Map<string, Promise<GLTF | undefined>>();
  private soundPromises = new Map<string, Promise<AudioBuffer | undefined>>();
  private texturePromises = new Map<string, Promise<THREE.Texture<HTMLImageElement> | undefined>>();
  private models = new Map<string, GLTF>();
  private sounds = new Map<string, AudioBuffer>();
  private textures = new Map<string, THREE.Texture<HTMLImageElement>>();

  private textureLoader = new THREE.TextureLoader();

  createGlb(path: string, isSkeleton?: boolean): Partial<GLTF> {
    const gltf = this.models.get(path);

    if (!gltf) {
      throw new Error(`GLB has not been loaded: ${path}`);
    }

    return {
      scene: isSkeleton ? (cloneSkeleton(gltf.scene) as THREE.Group) : (gltf.scene.clone() as THREE.Group),
      animations: gltf.animations,
    };
  }

  getTexture(path: string): THREE.Texture<HTMLImageElement> {
    const texture = this.textures.get(path);
    if (!texture) {
      throw new Error(`TExture has not been loaded: ${path}`);
    }

    return texture;
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

  preloadTexture(path: string): Promise<THREE.Texture<HTMLImageElement> | undefined> {
    if (this.textures.has(path)) {
      return Promise.resolve(this.textures.get(path)!);
    }

    if (!this.texturePromises.has(path)) {
      const promise = this.textureLoader
        .loadAsync(path)
        .then((texture) => {
          this.textures.set(path, texture);
          return texture;
        })
        .catch((r: any) => {
          console.error('error loading ' + path);
          return undefined;
        });
      this.texturePromises.set(path, promise);
    }

    return this.texturePromises.get(path)!;
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
