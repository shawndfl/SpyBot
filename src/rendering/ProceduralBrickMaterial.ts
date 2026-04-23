import * as THREE from 'three';

export type BakeMode = 'albedo' | 'height' | 'roughness' | 'metalness' | 'ao' | 'normal';

export const OUTPUT_MODES: Record<BakeMode, number> = {
  albedo: 0,
  height: 1,
  roughness: 2,
  metalness: 3,
  ao: 4,
  normal: 5,
};

export class ProceduralBrickMaterial {
  material: THREE.ShaderMaterial;

  constructor() {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uBrickScale: { value: new THREE.Vector2(7.0, 14.0) },
        uMortarSize: { value: 0.05 },
        uBrickColorA: { value: new THREE.Color('#7a211c') },
        uBrickColorB: { value: new THREE.Color('#9a3428') },
        uBrickColorC: { value: new THREE.Color('#5f1815') },
        uMortarColor: { value: new THREE.Color('#bfc1c4') },
        uMossColor: { value: new THREE.Color('#5e6f3d') },
        uDirtColor: { value: new THREE.Color('#3b3028') },
        uWaterDarken: { value: 0.18 },
        uOutputMode: { value: 0 },
        uNormalStrength: { value: 2.2 },
        uTime: { value: 0.0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vObjPos;
        varying vec3 vObjNormal;

        void main() {
          vUv = uv;
          vObjPos = position;
          vObjNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;

        varying vec2 vUv;
        varying vec3 vObjPos;
        varying vec3 vObjNormal;

        uniform vec2 uBrickScale;
        uniform float uMortarSize;
        uniform vec3 uBrickColorA;
        uniform vec3 uBrickColorB;
        uniform vec3 uBrickColorC;
        uniform vec3 uMortarColor;
        uniform vec3 uMossColor;
        uniform vec3 uDirtColor;
        uniform float uWaterDarken;
        uniform float uNormalStrength;
        uniform int uOutputMode;
        uniform float uTime;

        float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        vec2 hash22(vec2 p) {
          float n = hash12(p);
          return vec2(n, hash12(p + n + 17.0));
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);

          float a = hash12(i);
          float b = hash12(i + vec2(1.0, 0.0));
          float c = hash12(i + vec2(0.0, 1.0));
          float d = hash12(i + vec2(1.0, 1.0));

          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        struct BrickData {
          vec2 cellUv;
          vec2 brickId;
          float brickMask;
          float mortarMask;
          float edgeMask;
        };

        BrickData getBrickData(vec2 uv) {
          BrickData d;

          vec2 suv = uv * uBrickScale;
          float row = floor(suv.y);
          suv.x += mod(row, 2.0) * 0.5;

          vec2 brickId = floor(suv);
          vec2 cell = fract(suv);

          // brick edge distance
          float edgeDist = min(min(cell.x, 1.0 - cell.x), min(cell.y, 1.0 - cell.y));

          float brickMask = step(uMortarSize, cell.x) *
                            step(uMortarSize, cell.y) *
                            step(cell.x, 1.0 - uMortarSize) *
                            step(cell.y, 1.0 - uMortarSize);

          float mortarMask = 1.0 - brickMask;

          // 1 near edge, 0 deep inside brick
          float edgeMask = 1.0 - smoothstep(uMortarSize, uMortarSize + 0.12, edgeDist);

          d.cellUv = cell;
          d.brickId = brickId;
          d.brickMask = brickMask;
          d.mortarMask = mortarMask;
          d.edgeMask = edgeMask;
          return d;
        }

        vec3 brickColor(vec2 brickId, vec2 uv) {
          float r = hash12(brickId);
          vec3 base = mix(uBrickColorA, uBrickColorB, smoothstep(0.2, 0.8, r));
          base = mix(base, uBrickColorC, smoothstep(0.82, 0.98, r));

          // large-scale burn/dirt variation
          float macro = fbm(uv * 6.0);
          float micro = fbm(uv * 40.0 + brickId * 0.17);

          base *= mix(0.85, 1.1, macro);
          base *= mix(0.92, 1.04, micro);
          return base;
        }

        float chippedMask(BrickData d, vec2 uv) {
          float chipNoise = fbm(uv * 60.0 + d.brickId * 1.73);
          float chips = smoothstep(0.62, 0.82, chipNoise) * d.edgeMask * d.brickMask;
          return chips;
        }

        float mossMask(BrickData d, vec2 uv) {
          float damp = fbm(vec2(uv.x * 6.0, uv.y * 2.0));
          float cluster = fbm(uv * 22.0);
          float inMortar = d.mortarMask;
          float horizontalCatch = smoothstep(0.42, 0.75, d.edgeMask);
          float bottomBias = 1.0 - smoothstep(-0.8, 0.8, vObjPos.y);
          return clamp(inMortar * 0.8 + horizontalCatch * 0.25, 0.0, 1.0)
               * smoothstep(0.45, 0.85, cluster)
               * mix(0.5, 1.0, damp)
               * mix(0.65, 1.0, bottomBias);
        }

        float waterMask(vec2 uv) {
          // vertical streaks in object space
          float streakSeed = noise(vec2(floor(uv.x * 18.0), 0.0));
          float streak = fbm(vec2(uv.x * 18.0 + streakSeed * 4.0, uv.y * 3.0));
          float drips = smoothstep(0.72, 0.9, streak);

          // stronger higher up, trails down
          float vertical = smoothstep(0.2, 0.95, uv.y);
          return drips * vertical;
        }

        float dirtMask(BrickData d, vec2 uv, float chips, float water) {
          float cavity = d.mortarMask * 0.75 + chips * 0.4;
          float grime = fbm(uv * 25.0);
          return clamp(cavity + grime * 0.25 + water * 0.35, 0.0, 1.0);
        }

        float heightField(vec2 uv) {
          BrickData d = getBrickData(uv);

          float baseBrick = 0.72 * d.brickMask;
          float baseMortar = 0.38 * d.mortarMask;

          float chips = chippedMask(d, uv);
          float moss = mossMask(d, uv);
          float pitting = fbm(uv * 90.0 + d.brickId * 2.3) * 0.08 * d.brickMask;

          float h = mix(baseMortar, baseBrick, d.brickMask);
          h -= chips * 0.18;
          h -= pitting;
          h += moss * 0.05; // moss slightly puffs up
          return clamp(h, 0.0, 1.0);
        }

        vec3 normalFromHeight(vec2 uv) {
          float e = 1.0 / 1024.0;

          float hL = heightField(uv - vec2(e, 0.0));
          float hR = heightField(uv + vec2(e, 0.0));
          float hD = heightField(uv - vec2(0.0, e));
          float hU = heightField(uv + vec2(0.0, e));

          vec3 n = normalize(vec3((hL - hR) * uNormalStrength, (hD - hU) * uNormalStrength, 1.0));
          return n;
        }

        void main() {
          vec2 uv = vUv;
          BrickData d = getBrickData(uv);

          float chips = chippedMask(d, uv);
          float moss = mossMask(d, uv);
          float water = waterMask(uv);
          float dirt = dirtMask(d, uv, chips, water);
          float height = heightField(uv);
          vec3 normalTex = normalFromHeight(uv);

          vec3 albedo = mix(uMortarColor, brickColor(d.brickId, uv), d.brickMask);

          // chipped areas expose lighter dusty ceramic core
          albedo = mix(albedo, vec3(0.72, 0.48, 0.38), chips * 0.45);

          // dirt in recesses
          albedo = mix(albedo, uDirtColor, dirt * 0.28);

          // moss overlay
          albedo = mix(albedo, uMossColor, moss * 0.85);

          // water darkening
          albedo *= (1.0 - water * uWaterDarken);

          // roughness
          float roughness = 0.92; // mortar baseline
          roughness = mix(roughness, 0.78, d.brickMask);
          roughness = mix(roughness, 0.98, dirt * 0.4);
          roughness = mix(roughness, 0.95, moss * 0.35);
          roughness = mix(roughness, 0.52, water); // wet streaks are smoother

          // metalness
          float metalness = 0.0;

          // cheap cavity AO from height and mortar
          float ao = clamp(1.0 - (d.mortarMask * 0.22 + chips * 0.18 + dirt * 0.1), 0.0, 1.0);

          if (uOutputMode == 0) {
            gl_FragColor = vec4(albedo, 1.0);
          } else if (uOutputMode == 1) {
            gl_FragColor = vec4(vec3(height), 1.0);
          } else if (uOutputMode == 2) {
            gl_FragColor = vec4(vec3(roughness), 1.0);
          } else if (uOutputMode == 3) {
            gl_FragColor = vec4(vec3(metalness), 1.0);
          } else if (uOutputMode == 4) {
            gl_FragColor = vec4(vec3(ao), 1.0);
          } else {
            // pack normal 0..1
            gl_FragColor = vec4(normalTex * 0.5 + 0.5, 1.0);
          }
        }
      `,
    });
  }
}
