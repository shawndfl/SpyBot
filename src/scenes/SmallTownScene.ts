import * as THREE from 'three';

import { TransformComponent } from '../components/TransformComponent';
import type { World } from '../ecs/World';
import { GameScene } from './GameScene';
import { PointLightComponent } from '../components/lights/PointLightComponent';
import { MeshGlbComponent } from '../components/mesh/MeshGlbComponent';
import { SunLightComponent } from '../components/SunLightComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { AnimationComponent } from '../components/AnimationComponent';
import { CameraComponent } from '../components/CameraComponent';
import { ConstraintComponent } from '../components/ConstraintComponent';
import { TerrainComponent } from '../components/mesh/TerrainComponent';
//import { ProceduralTextureBaker } from '../rendering/ProceduralTextureBaker';
//import { ProceduralBrickMaterial } from '../rendering/ProceduralBrickMaterial';

export class SmallTownScene extends GameScene {
  private renderer?: THREE.WebGLRenderer;

  create(world: World, scene: THREE.Scene, renderer: THREE.WebGLRenderer): World {
    this.renderer = renderer;

    // create player
    const player = world.createEntity();
    const playerTransform = new TransformComponent({ name: 'player' });
    const playerComponent = new PlayerComponent();
    playerComponent.speed = 5.5;
    world.addComponent(player, new MeshGlbComponent({ filename: 'Ness.glb', name: 'player' }));
    world.addComponent(player, new AnimationComponent());
    world.addComponent(player, new PlayerComponent());
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
    const followPlayerConstraint = new ConstraintComponent();
    followPlayerConstraint.targetOffset = new THREE.Vector3(0, 1.5, 4.5);
    followPlayerConstraint.FarMovementSpeed = 10;
    followPlayerConstraint.closeMovementSpeed = playerComponent.speed + 0.01;
    followPlayerConstraint.outerDistance = 10;
    followPlayerConstraint.innerDistance = 7;
    followPlayerConstraint.source = cameraTransform;
    followPlayerConstraint.target = playerTransform;
    world.addComponent(camera, followPlayerConstraint);

    // create sun
    const sun = world.createEntity();
    world.addComponent(sun, new SunLightComponent().setDayLengthInMs(120000).setStartTime(6));

    // create lamp post
    const lampPost = world.createEntity();
    world.addComponent(lampPost, new MeshGlbComponent({ filename: 'lampPost.glb' }));

    const pointLight = new PointLightComponent();
    pointLight.castShadow = true;
    pointLight.color = new THREE.Color(THREE.Color.NAMES.yellow);
    pointLight.distance = 5;

    world.addComponent(lampPost, pointLight);
    world.addComponent(lampPost, new TransformComponent().setPosition(0, 0, -2));

    const terrain = world.createEntity();
    world.addComponent(terrain, new TransformComponent());
    world.addComponent(
      terrain,
      new TerrainComponent({
        width: 200,
        depth: 200,
        segments: 150,
        repeat: new THREE.Vector2(70, 70),
        grassTexturePath: '/grass.jpg',
      })
    );

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
