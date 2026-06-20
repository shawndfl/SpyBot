import * as THREE from 'three';

import { System } from '../ecs/System';
import type { UpdateEvent } from '../core/UpdateEvent';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';
import { RendererComponent } from '../components/mesh/RendererComponent';
import { AnimationComponent } from '../components/AnimationComponent';
import { TransformComponent } from '../components/TransformComponent';
import { TerrainComponent } from '../components/mesh/TerrainComponent';
import { Engine } from '../core/Engine';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';

/**
 * Initialize gltf files and loads their animations into animation components
 */
export class RenderInitSystem extends System {
  constructor(private _scene: THREE.Scene) {
    super();
  }

  update({ world }: UpdateEvent): void {
    // find all entities with a mesh glb and transform component
    for (let [entity, glb, transform] of world.queryWithEntity(MeshGlbComponent, TransformComponent)) {
      // if there is no renderer component then add one using the glb
      if (!world.hasComponent(entity, RendererComponent)) {
        // see if there is an animation
        const animation = world.getComponent(entity, AnimationComponent);

        const rootMesh = this.loadGlb(transform.root, glb.filename, glb, animation);
        const rendererComponent = new RendererComponent(rootMesh);
        world.addComponent(entity, rendererComponent);

        // set the height to the height of the terrain if it's there.
        // this should be done only once to allow other systems to manipulate
        // the transformation
        if (glb.useTerrainHeight) {
          const [[terrainComponent]] = world.query(TerrainComponent);
          let getHeightFromTerrain = terrainComponent?.getHeight;
          if (getHeightFromTerrain) {
            const height = getHeightFromTerrain(transform.position.x, transform.position.z);

            const rigidBody = world.getComponent(entity, RigidBodyComponent);
            if (rigidBody.body) {
              const current = rigidBody.body?.translation();
              rigidBody.body?.setNextKinematicTranslation({ x: current.x, y: height, z: current.z });
            } else {
              transform.position.y = height;
            }
          }
        }
      }
    }
  }

  /**
   * Loads a glb object. This includes its animations and sets up the materials.
   * It will also load the first frame of the first animation
   * @param mesh
   * @param path
   * @param animation
   * @returns
   */
  protected loadGlb(
    transform: THREE.Object3D,
    path: string,
    glbComponent: MeshGlbComponent,
    animation?: AnimationComponent,
  ): THREE.Object3D | undefined {
    if (!path) {
      return;
    }
    const gltf = Engine.assets.createGlb(path, glbComponent.skeletonMesh);

    // load the model and parse out the object3d and meshes
    this.loadModel(gltf.scene!, transform, glbComponent);
    this.loadAnimation(gltf.scene!, gltf.animations!, animation);
    return transform;
  }

  private loadAnimation(model: THREE.Group, clips: THREE.AnimationClip[], animation?: AnimationComponent): void {
    if (animation) {
      const mixer = new THREE.AnimationMixer(model);
      animation.setMixer(mixer).setClips(clips);
      const idle = clips.find((a) => a.name == 'Idle');
      if (idle) {
        // update so characters are not sitting in a t pose
        animation.play('Idle');
        animation.playFirst();
        mixer.update(0.016);
      }
    }
  }

  /**
   * Traverse the mesh and process each node
   * @param model
   * @param root
   */
  private loadModel(model: THREE.Group, root: THREE.Object3D, glbComponent: MeshGlbComponent): void {
    // connect the model to the root and to the scene
    root.add(model);
    this._scene.add(root);

    // loop over the children in this model
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        this.processMesh(child as THREE.Mesh, glbComponent);
      } else if ((child as THREE.Object3D).isObject3D) {
        this.processNode(child);
      }
    });
  }

  /**
   * Process the mesh
   * @param mesh
   */
  private processMesh(mesh: THREE.Mesh, glbComponent: MeshGlbComponent): void {
    mesh.castShadow = !!glbComponent.castShadow;

    // Optional: ensure correct color space
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      //mesh.material.envMapIntensity = 0.1;
    }
  }

  /**
   * This will process none mesh modes
   */
  private processNode(node: THREE.Object3D): void {
    if (!node?.isObject3D) {
      return;
    }

    if (node.name.startsWith('COL_')) {
      const center = node.position.clone();
      const size = node.scale.clone();
      const box = new THREE.Box3().setFromCenterAndSize(center, size);
      console.debug('found box node ' + node.name, box);
    } else if (node.name.startsWith('P_')) {
      const dir = new THREE.Vector3();
      node.getWorldDirection(dir);
      const right = node.up.clone().cross(dir).normalize();

      console.debug('found point node ' + node.name, right, node.up, dir);
    }
    //console.debug('   Scale ', node.scale);
  }
}
