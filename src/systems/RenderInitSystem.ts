import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { System } from '../ecs/System';
import type { UpdateEvent } from '../core/UpdateEvent';
import { Transform } from '../components/Transform';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';
import { RendererComponent } from '../components/mesh/RendererComponent';

export class RenderInitSystem extends System {
  constructor(componentMask: number, private _scene: THREE.Scene) {
    super(componentMask);
  }

  loadGltf(mesh: THREE.Object3D, path?: string): void {
    if (!path) {
      return;
    }
    const loader = new GLTFLoader();
    loader.load(path, (gltf) => {
      const model = gltf.scene;
      this._scene.add(mesh);

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;

          //mesh.castShadow = true;
          //mesh.receiveShadow = true;

          // Optional: ensure correct color space
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.envMapIntensity = 0.1;
          }
        }
      });

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log(child.material);
        }
      });
      mesh.add(model);
    });
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    // find all entities with a mesh glb and transform component
    for (let [entity, glb] of world.queryWithEntity(MeshGlbComponent, Transform)) {
      // if there is no renderer component then add one using the glb
      if (!world.hasComponent(entity, RendererComponent)) {
        const mesh = new THREE.Mesh();
        this.loadGltf(mesh, glb.filename);
        const rendererComponent = new RendererComponent(mesh);
        world.addComponent(entity, rendererComponent);
      }
    }
  }
}
