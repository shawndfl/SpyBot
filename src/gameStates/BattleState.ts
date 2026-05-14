import * as THREE from 'three';

import { TransformComponent } from '../components/TransformComponent';
import { World } from '../ecs/World';
import { PointLightComponent } from '../components/lights/PointLightComponent';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';
import { SunLightComponent } from '../components/SunLightComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { AnimationComponent } from '../components/AnimationComponent';
import { CameraComponent } from '../components/CameraComponent';
import { ConstraintComponent } from '../components/ConstraintComponent';
import { TerrainComponent } from '../components/mesh/TerrainComponent';
import type { GameState } from '../core/GameState';
import type { TransitionContext } from '../core/TransitionContext';
import type { UpdateEvent } from '../core/UpdateEvent';
import { InputSystem } from '../systems/InputSystem';
import { ComponentRegistry, type ComponentCtor } from '../ecs/ComponentRegistry';
import { MovementSystem } from '../systems/MovementSystem';
import { ConstraintSystem } from '../systems/rendering/ConstraintSystem';
import { CameraSyncSystem } from '../systems/CameraSyncSystem';
import { TerrainSystem } from '../systems/TerrainSystem';
import { LightInitSystem } from '../systems/rendering/LightInitSystem';
import { LightSyncSystem } from '../systems/rendering/LightSyncSystem';
import { LightComponent } from '../components/lights/LightComponent';
import { RendererComponent } from '../components/mesh/RendererComponent';
import { RenderInitSystem } from '../systems/RenderInitSystem';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { BoxCollisionSystem } from '../systems/BoxCollisionSystem';

import { BoxColliderComponent } from '../components/BoxColliderComponent';
import { BattleBackgroundComponent } from '../components/BattleBackgroundComponent';
import { BattleBackgroundSystem } from '../systems/BattleBackgroundSystem';
import { SunSystem } from '../systems/SunSystem';
import { Engine } from '../core/Engine';
//import { ProceduralTextureBaker } from '../rendering/ProceduralTextureBaker';
//import { ProceduralBrickMaterial } from '../rendering/ProceduralBrickMaterial';

export class BattleState implements GameState {
  protected _world?: World;
  private _inputSystem?: InputSystem;
  protected _scene: THREE.Scene = new THREE.Scene();

  constructor() {}

  enter(context?: TransitionContext): void {
    this._world = this.createWorld();
  }

  exit(): void {}

  /**
   * update the game state
   * @param updateEvent
   */
  update(updateEvent: UpdateEvent): void {
    // use our world
    updateEvent.world = this._world!;

    // update all the systems
    for (let system of this._world!.systems) {
      system.update(updateEvent);
    }

    this._inputSystem!.resetFrameInputs();
  }

  protected createWorld(): World {
    const fn = (x: ComponentCtor) => ComponentRegistry.getId(x);
    const scene = this._scene;
    const renderer = Engine.renderer;

    this._inputSystem = new InputSystem(fn(TransformComponent));
    const world = new World([
      this._inputSystem,
      new MovementSystem(fn(PlayerComponent) | fn(TransformComponent)),
      new ConstraintSystem(fn(ConstraintComponent) | fn(TransformComponent)),
      new CameraSyncSystem(fn(CameraComponent) | fn(TransformComponent)),
      new BoxCollisionSystem(fn(BoxColliderComponent), scene),
      new TerrainSystem(fn(TerrainComponent) | fn(TransformComponent), scene),

      new BattleBackgroundSystem(fn(BattleBackgroundComponent), renderer),

      new SunSystem(fn(SunLightComponent) | fn(CameraComponent) | fn(PlayerComponent), scene, renderer),
      new LightInitSystem(fn(RendererComponent) | fn(TransformComponent), scene),
      new LightSyncSystem(fn(RendererComponent) | fn(TransformComponent) | fn(LightComponent)),
      new RenderInitSystem(fn(TransformComponent) | fn(MeshGlbComponent), scene),
      new AnimationSystem(fn(AnimationComponent)),
      new RenderSystem(fn(RendererComponent) | fn(TransformComponent) | fn(SunLightComponent), scene, renderer),
    ]);
    // create player
    const player = world.createEntity();
    const playerTransform = new TransformComponent({ name: 'player' });
    const playerComponent = new PlayerComponent();
    playerComponent.speed = 5.5;
    world.addComponent(player, new MeshGlbComponent({ filename: 'Ness.glb', name: 'player' }));
    world.addComponent(player, new AnimationComponent());
    world.addComponent(player, new PlayerComponent());
    world.addComponent(
      player,
      new BoxColliderComponent({
        debug: true,
        offset: new THREE.Vector3(0, 0.5, 0),
        size: new THREE.Vector3(0.5, 1.2, 0.5),
        dynamic: true,
      })
    );
    world.addComponent(player, playerTransform);

    // camera
    const camera = world.createEntity();
    world.addComponent(camera, new CameraComponent());
    const cameraTransform = new TransformComponent({
      position: new THREE.Vector3(10, 10, 10),
      name: 'camera',
    });
    world.addComponent(camera, cameraTransform);

    // make sure the camera can follow the player
    const followPlayerConstraint = new ConstraintComponent({
      targetOffset: new THREE.Vector3(0, 1.5, 5.5),
      FarMovementSpeed: 10,
      closeMovementSpeed: playerComponent.speed + 0.01,
      outerDistance: 10,
      innerDistance: 7,
      source: cameraTransform,
      target: playerTransform,
    });
    world.addComponent(camera, followPlayerConstraint);

    // create sun
    const sun = world.createEntity();
    world.addComponent(sun, new SunLightComponent().setDayLengthInMs(120000).setStartTime(8));

    // create lamp post
    const lampPost = world.createEntity();
    world.addComponent(lampPost, new MeshGlbComponent({ filename: 'lampPost.glb' }));

    const pointLight = new PointLightComponent();
    pointLight.castShadow = true;
    pointLight.color = new THREE.Color(THREE.Color.NAMES.yellow);
    pointLight.distance = 5;

    world.addComponent(lampPost, pointLight);
    world.addComponent(lampPost, new TransformComponent().setPosition(0, 0, -2));

    // terrain
    const terrain = world.createEntity();
    world.addComponent(terrain, new TransformComponent());
    world.addComponent(
      terrain,
      new TerrainComponent({
        width: 200,
        depth: 200,
        segments: 150,
        heightScale: 1.0,
        repeat: new THREE.Vector2(100, 100),
        grassTexturePath: '/grass.jpg',
      })
    );

    // boxCollider
    const portalBox = world.createEntity();
    world.addComponent(
      portalBox,
      new BoxColliderComponent({
        size: new THREE.Vector3(1, 1, 1),
        debug: true,
      }),
      new TransformComponent({
        position: new THREE.Vector3(0, 0, -10),
      })
    );

    const battleScene = world.createEntity();
    world.addComponent(battleScene, new BattleBackgroundComponent({}));

    // initialize all the systems
    for (let system of world.systems) {
      system.initialize();
    }

    return world;
  }
  /*
  createBrickTextures(): void {
    const brick = new ProceduralBrickMaterial();
    const baker = new ProceduralTextureBaker(this.renderer, brick.material);
    const bakedAlbedoPixels = baker.bake('albedo');
    const bakedNormalPixels = baker.bake('normal');
    const bakedRoughPixels = baker.bake('roughness');
    const bakedAOPixels = baker.bake('ao');
    const bakedMetalPixels = baker.bake('metalness');

    const map = pixelsToDataTexture(bakedAlbedoPixels, 2048, THREE.SRGBColorSpace);
    const normalMap = pixelsToDataTexture(bakedNormalPixels, 2048);
    const roughnessMap = pixelsToDataTexture(bakedRoughPixels, 2048);
    const aoMap = pixelsToDataTexture(bakedAOPixels, 2048);
    const metalnessMap = pixelsToDataTexture(bakedMetalPixels, 2048);
  }

  savePixelsAsPng(pixels: Uint8Array, size: number, filename: string) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(size, size);

    // flip Y because WebGL readback is bottom-up
    for (let y = 0; y < size; y++) {
      const srcY = size - 1 - y;
      for (let x = 0; x < size; x++) {
        const src = (srcY * size + x) * 4;
        const dst = (y * size + x) * 4;
        imageData.data[dst + 0] = pixels[src + 0];
        imageData.data[dst + 1] = pixels[src + 1];
        imageData.data[dst + 2] = pixels[src + 2];
        imageData.data[dst + 3] = pixels[src + 3];
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = filename;
    a.click();
  }
    */
}
