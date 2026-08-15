import * as THREE from 'three';
import grassFragmentShader from '../../assets/shaderToys/grass.shader?raw';

const terrainVertexShader = /* glsl */ `
  #include <fog_pars_vertex>

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

export function createProceduralGrassMaterial(repeat: THREE.Vector2, worldScale?: THREE.Vector2): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
      uRepeat: { value: repeat.clone() },
      uWorldScale: { value: worldScale?.clone() ?? new THREE.Vector2() },
      uUseWorldPosition: { value: worldScale ? 1 : 0 },
    },
    fog: true,
    vertexShader: terrainVertexShader,
    fragmentShader: /* glsl */ `
      precision highp float;

      #include <fog_pars_fragment>

      uniform vec3 iResolution;
      uniform vec2 uRepeat;
      uniform vec2 uWorldScale;
      uniform float uUseWorldPosition;
      varying vec2 vUv;
      varying vec3 vWorldPosition;

      ${grassFragmentShader}

      void main() {
        vec2 uvCoordinates = vUv * uRepeat;
        vec2 worldCoordinates = vWorldPosition.xz * uWorldScale;
        vec2 grassCoordinates = mix(uvCoordinates, worldCoordinates, uUseWorldPosition);
        mainImage(gl_FragColor, grassCoordinates * iResolution.xy);
        #include <fog_fragment>
      }
    `,
  });
}
