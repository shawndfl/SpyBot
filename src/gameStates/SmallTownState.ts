import * as THREE from 'three';

import { TransformComponent } from '../components/TransformComponent';
import { World } from '../ecs/World';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';
import { SunLightComponent } from '../components/SunLightComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { AnimationComponent } from '../components/AnimationComponent';
import { CameraComponent } from '../components/CameraComponent';
import type { GameState } from '../core/GameState';
import type { TransitionContext } from '../core/TransitionContext';
import type { UpdateEvent } from '../core/UpdateEvent';
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CameraSyncSystem } from '../systems/CameraSyncSystem';
import { PlayerFollowCameraSystem } from '../systems/PlayerFollowCameraSystem';
import { LightSystem } from '../systems/rendering/LightSystem';
import { RenderInitSystem } from '../systems/RenderInitSystem';
import { AnimationSystem } from '../systems/AnimationSystem';
import { RenderSystem } from '../systems/RenderSystem';
import { BattleBackgroundComponent } from '../components/BattleBackgroundComponent';
import { BattleBackgroundSystem } from '../systems/BattleBackgroundSystem';
import { SunSystem } from '../systems/SunSystem';
import { Engine } from '../core/Engine';
import { ParticleEmitterSystem } from '../systems/ParticleEmitterSystem';
import { DebugModeSystem } from '../systems/DebugModeSystem';
import { DebugHudSystem } from '../systems/DebugHudSystem';
import { GuiDebugComponent } from '../components/GuiDebugComponent';
import { EnemySpawnFactory } from '../entities/EnemySpawnFactory';
import { LampPostSystem } from '../systems/LampPostSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { EntityTriggerDispatchSystem } from '../systems/EntityTriggerDispatchSystem';
import { RigidBodyComponent } from '../components/physics/RigidBodyComponent';
import { PropFactory } from '../entities/PropFactory';
import { DialogComponent } from '../components/DialogComponent';
import { DialogSystem } from '../systems/DialogSystem';
import { TargetingComponent } from '../components/TargetingComponent';
import { TargetingSystem } from '../systems/TargetingSystem';
import { NpcFactory } from '../entities/NpcFactory';
import { ColliderSensorComponent } from '../components/physics/ColliderSensorComponent';
import { DEFAULT_PROCEDURAL_CONFIG } from '../procedural/ProceduralConfig';
import { ChunkGenerator } from '../procedural/ChunkGenerator';
import { ProceduralChunkSystem } from '../procedural/materialization/ProceduralChunkSystem';
import { TerrainHeightResource } from '../procedural/resources/TerrainHeightResource';
import { PlayerProgressResource } from '../procedural/resources/PlayerProgressResource';
import { LocalSaveStore } from '../persistence/LocalSaveStore';
import { GoldCollectionSystem } from '../systems/GoldCollectionSystem';
import { AudioSystem } from '../systems/AudioSystem';
import { PlayerFootstepSystem } from '../systems/PlayerFootstepSystem';
import { PlayerProgressSystem } from '../systems/PlayerProgressSystem';
//import { ProceduralTextureBaker } from '../rendering/ProceduralTextureBaker';
//import { ProceduralBrickMaterial } from '../rendering/ProceduralBrickMaterial';

export class SmallTownState implements GameState {
  protected _world?: World;
  private _inputSystem?: InputSystem;
  protected _scene: THREE.Scene = new THREE.Scene();

  constructor() {}

  enter(context?: TransitionContext): void {
    this._world = this.createWorld();
  }

  exit(): void {
    if (!this._world?.resources.hasResource(PlayerProgressResource)) {
      return;
    }
    const playerResult = this._world.query(PlayerComponent, TransformComponent).next();
    if (!playerResult.done) {
      const [, transform] = playerResult.value;
      const progress = this._world.resources.getResource(PlayerProgressResource);
      progress.updatePlayerPosition(transform.position);
      progress.save();
    }
  }

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
    const scene = this._scene;
    const renderer = Engine.renderer;
    const chunkGenerator = new ChunkGenerator(DEFAULT_PROCEDURAL_CONFIG);

    this._inputSystem = new InputSystem();
    const world = new World([
      this._inputSystem,
      new DebugModeSystem(),

      // Stream generated terrain before movement and physics consume its height.
      new ProceduralChunkSystem(scene, chunkGenerator, DEFAULT_PROCEDURAL_CONFIG),

      // update the player movement
      new MovementSystem(),
      new PlayerFootstepSystem(),

      // physics. this will perform the physics step and update the transform component.
      new PhysicsSystem(scene, Engine.physicsContext),
      new PlayerProgressSystem(),
      new GoldCollectionSystem(),
      new AudioSystem(Engine.audio),
      new EntityTriggerDispatchSystem(),

      new TargetingSystem(scene),

      // load glbs and create rendererComponents
      new RenderInitSystem(scene),

      new PlayerFollowCameraSystem(),
      new CameraSyncSystem(),

      new BattleBackgroundSystem(renderer),

      new SunSystem(scene, renderer),

      new LampPostSystem(),
      new LightSystem(scene),

      new AnimationSystem(),

      // render systems
      new RenderSystem(scene, renderer),
      new ParticleEmitterSystem(scene),
      new DialogSystem(),
      new DebugHudSystem(),
    ]);

    world.resources.addResource(new TerrainHeightResource(chunkGenerator));
    const progress = new PlayerProgressResource(new LocalSaveStore(window.localStorage));
    world.resources.addResource(progress);

    // root level entity
    const sceneRoot = world.createEntity();
    world.addComponent(sceneRoot, new GuiDebugComponent({}));
    world.addComponent(sceneRoot, new TargetingComponent());

    const dialogEntity = world.createEntity();
    world.addComponent(dialogEntity, new DialogComponent());

    // create player
    const player = world.createEntity();
    const spawnPosition = progress.playerPosition.clone();
    const playerTransform = new TransformComponent({
      position: spawnPosition,
      scale: new THREE.Vector3(1, 1, -1),
    });
    const playerComponent = new PlayerComponent();
    playerComponent.speed = 5.5;
    world.addComponent(
      player,
      new MeshGlbComponent({
        filename: 'player.glb',
        name: 'player',
        castShadow: true,
        skeletonMesh: true,
      }),
    );
    world.addComponent(player, new AnimationComponent());
    world.addComponent(player, playerComponent);
    world.addComponent(
      player,
      new ColliderSensorComponent({
        debug: true,
        size: new THREE.Vector3(0.5, 1.2, 0.5),
      }),
      new RigidBodyComponent({
        type: 'kinematic',
        requestPlayerController: true,
        initialPosition: spawnPosition.clone(),
        useTerrainHeight: true,
      }),
      playerTransform,
    );

    // camera
    const camera = world.createEntity();
    world.addComponent(camera, new CameraComponent());
    const cameraTransform = new TransformComponent({
      position: new THREE.Vector3(10, 10, 10),
    });
    world.addComponent(camera, cameraTransform);

    // create sun
    const sun = world.createEntity();
    world.addComponent(sun, new SunLightComponent().setDayLengthInMs(120000).setStartTime(8));

    // create a bunch of lamps
    for (let i = 0; i < 5; i++) {
      PropFactory.addLampPost(world, {
        position: new THREE.Vector3(10 * i, 0, 3),
        debug: false,
        color: new THREE.Color(THREE.Color.NAMES.yellow),
        lampId: 'lamp_' + i,
      });
    }

    // create an NPC
    NpcFactory.addNpc(world, { debug: true });

    EnemySpawnFactory.knightEnemy(world, {
      position: new THREE.Vector3(-5, 0, 5),
      debug: true,
    });

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
