import * as THREE from 'three';
export interface ParticleInit {
  lifetime: number;

  gravityY: number;

  position: THREE.Vector3;
  velocity: THREE.Vector3;

  sizeStart: number;
  sizeEnd: number;

  colorStart: THREE.Color;
  colorEnd: THREE.Color;

  alphaStart: number;
  alphaEnd: number;

  rotationStart: number;
  angularVelocity: number;
}

export interface Particle extends ParticleInit {
  active?: boolean;

  age: number;

  size: number;
  color: THREE.Color;
  alpha: number;

  rotation: number;
}
