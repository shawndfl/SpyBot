import * as THREE from 'three';
import { OUTPUT_MODES, type BakeMode } from './ProceduralBrickMaterial';

export class ProceduralTextureBaker {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private quad: THREE.Mesh;
  private target: THREE.WebGLRenderTarget;
  private material: THREE.ShaderMaterial;
  private size: number;

  constructor(renderer: THREE.WebGLRenderer, material: THREE.ShaderMaterial, size = 2048) {
    this.renderer = renderer;
    this.material = material;
    this.size = size;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(this.quad);

    this.target = new THREE.WebGLRenderTarget(size, size, {
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  bake(mode: BakeMode): Uint8Array {
    this.material.uniforms.uOutputMode.value = OUTPUT_MODES[mode];

    this.renderer.setRenderTarget(this.target);
    this.renderer.render(this.scene, this.camera);

    const pixels = new Uint8Array(this.size * this.size * 4);
    this.renderer.readRenderTargetPixels(this.target, 0, 0, this.size, this.size, pixels);

    this.renderer.setRenderTarget(null);
    return pixels;
  }

  dispose() {
    this.target.dispose();
    this.quad.geometry.dispose();
  }
}
