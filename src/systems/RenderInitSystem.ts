import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { System } from '../ecs/System';
import type { UpdateEvent } from '../core/UpdateEvent';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';
import { RendererComponent } from '../components/mesh/RendererComponent';
import { AnimationComponent } from '../components/AnimationComponent';

/**
 * Initialize gltf files and loads their animations into animation components
 */
export class RenderInitSystem extends System {
  constructor(
    componentMask: number,
    private _scene: THREE.Scene,
  ) {
    super(componentMask);
  }

  /**
   * Loads a gltf object. This includes its animations and sets up the materials.
   * It will also load the first frame of the first animation
   * @param mesh
   * @param path
   * @param animation
   * @returns
   */
  protected async loadGltf(mesh: THREE.Object3D, path: string, animation?: AnimationComponent): Promise<boolean> {
    if (!path) {
      return false;
    }
    const loader = new GLTFLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          const model = gltf.scene;

          mesh.add(model);
          this._scene.add(mesh);

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;

              mesh.castShadow = true;

              // Optional: ensure correct color space
              if (mesh.material instanceof THREE.MeshStandardMaterial) {
                mesh.material.envMapIntensity = 0.1;
              }
            }
          });

          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              console.log(' material ' + child.material);
            }
          });

          if (animation) {
            const mixer = new THREE.AnimationMixer(gltf.scene);
            animation.setMixer(mixer).setClips(gltf.animations);
            const idle = gltf.animations.find((a) => a.name == 'Idle');
            if (idle) {
              // update so characters are not sitting in a t pose
              animation.play('Idle');
              animation.playFirst();
            }
          }

          resolve(true);
        },
        undefined,
        (err) => {
          console.error('Error loading ' + path, err);
          resolve(false);
        },
      );
    });
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    // find all entities with a mesh glb and transform component
    for (let [entity, glb] of world.queryWithEntity(MeshGlbComponent)) {
      // if there is no renderer component then add one using the glb
      if (!world.hasComponent(entity, RendererComponent)) {
        const mesh = new THREE.Mesh();
        const animation = world.getComponent(entity, AnimationComponent);
        this.loadGltf(mesh, glb.filename, animation);
        const rendererComponent = new RendererComponent(mesh);
        world.addComponent(entity, rendererComponent);
      }
    }
  }
}
