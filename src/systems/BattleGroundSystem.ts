import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BattleFieldComponent } from '../components/BattleFieldComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

export class BattleGroundSystem extends System {
  constructor(componentMask: number, private _scene: THREE.Scene) {
    super(componentMask);
  }

  private loadGround(battleField: BattleFieldComponent): void {
    if (!battleField.battleGlbFilename || battleField.groundMesh || battleField.isLoading) {
      return;
    }

    battleField.isLoading = true;

    const root = new THREE.Object3D();
    const loader = new GLTFLoader();

    loader.load(
      battleField.battleGlbFilename,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.receiveShadow = true;
            //mesh.castShadow = true;
          } else if ((child as THREE.Light).isLight) {
            const light = child as THREE.Light;

            light.position.y = 10;
            light.intensity *= 0.002; // make brighter
            light.castShadow = true;

            //console.log(light.name, light.type, light.intensity);
          }
          // if this is just an object capture it by name
          else {
            this.checkObject3D(battleField, child);
          }
        });

        root.add(gltf.scene);
        this._scene.add(root);

        battleField.groundMesh = root;
        battleField.isLoading = false;
      },
      undefined,
      (error) => {
        console.error(`Failed to load battle ground GLB: ${battleField.battleGlbFilename}`, error);
        battleField.isLoading = false;
      }
    );
  }

  /**
   * If this object 3d is useful capture it in the component
   * @param battleField
   * @param object3D
   */
  protected checkObject3D(battleField: BattleFieldComponent, object3D: THREE.Object3D): void {
    if (object3D.name == 'CharacterPosition') {
      battleField.playerAnchor = object3D;
    }
  }

  update({ world }: UpdateEvent): void {
    for (let [battleField, transform] of world.query(BattleFieldComponent, TransformComponent)) {
      this.loadGround(battleField);

      if (!battleField.groundMesh) {
        continue;
      }

      battleField.groundMesh.position.copy(transform.position);
      battleField.groundMesh.rotation.copy(transform.rotation);
      battleField.groundMesh.scale.copy(transform.scale);
    }
  }
}
