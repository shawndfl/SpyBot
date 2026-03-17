import * as THREE from 'three';
import type GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

export interface IRenderSystem {
  get scene(): THREE.Scene;

  get renderer(): THREE.WebGLRenderer;

  get gui(): GUI;
}
