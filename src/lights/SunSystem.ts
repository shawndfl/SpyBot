import * as THREE from 'three';
import type { UpdateEvent } from '../core/UpdateEvent';
import { SunLightComponent } from '../components/SunLightComponent';
import { CameraComponent } from '../components/CameraComponent';
import { TransformComponent } from '../components/TransformComponent';
import { System } from '../ecs/System';
import type { World } from '../ecs/World';
import { PlayerComponent } from '../components/PlayerComponent';

export const LocationOnEarth = {
  latitude: 28.5383, // latitude (Orlando)
  longitude: -81.3792, // longitude
};

export const MillisecondsInDay = 86400000;

export class SunSystem extends System {
  private _startTime: number = -1;
  private _time: number = -1;
  private _timeScale: number = 1;
  private _latitude: number = LocationOnEarth.latitude;
  private _longitude: number = LocationOnEarth.longitude;
  private _sunOffset: THREE.Vector3 = new THREE.Vector3();

  private _date = new Date();

  private _isSunUp: boolean = false;

  constructor(componentMask: number, private _scene: THREE.Scene, private _renderer: THREE.WebGLRenderer) {
    super(componentMask);
    this._renderer.toneMappingExposure = 2.0; // try 1.5 to 2.5
  }

  isSunUp(): boolean {
    return this._isSunUp;
  }

  setSunState(sunLight: SunLightComponent): void {
    if (!sunLight) {
      return;
    }

    if (Math.abs(this._startTime - sunLight.time) > 0) {
      this._startTime = sunLight.time;
      this._time = this._startTime;
    }

    this._timeScale = MillisecondsInDay / sunLight.millisecondsInDay;

    this._latitude = sunLight.latitude ?? LocationOnEarth.latitude;
    this._longitude = sunLight.longitude ?? LocationOnEarth.longitude;
  }

  update({ world, dt }: UpdateEvent): void {
    // update time
    const step = dt * 1000 * this._timeScale;
    this._time += step;
    //dthis._time = 1767271432400; // sun rise

    // update sun.
    for (let [sun] of world.query(SunLightComponent)) {
      if (!sun.light) {
        this.createSun(sun);
      }
      const followTarget = sun.followCamera ? this.getCameraTransform(world) : this.getPlayerTransform(world);

      if (!followTarget || !sun.light || !sun.target) {
        continue;
      }

      this.updateSunPosition(sun, followTarget);
      this.updateShadowCamera(sun, followTarget);
      this.updateLightTransitions(sun);

      if (sun.helper) {
        sun.helper.update();
      }

      // there should only be one sun
      break;
    }
  }

  private createSun(sun: SunLightComponent): void {
    const light = new THREE.DirectionalLight(sun.color, sun.intensity);
    light.castShadow = true;

    const target = new THREE.Object3D();

    light.target = target;

    light.shadow.mapSize.set(sun.shadowMapSize, sun.shadowMapSize);

    this._scene.add(light);
    this._scene.add(target);

    sun.light = light;
    sun.target = target;

    this._scene.add(sun.ambientLight);

    this.configureShadowCamera(sun);

    // set the start time
    this.setSunState(sun);

    if (sun.debug) {
      sun.helper = new THREE.CameraHelper(light.shadow.camera);
      this._scene.add(sun.helper);
    }
  }

  // private _ambientFade = new THREE.Vector3();
  private _lastElevate: number = 0;
  private updateLightTransitions(sun: SunLightComponent): void {
    const elevation = sun.elevation!;
    this._date.setTime(this._time);
    const isRising = elevation - this._lastElevate > 0;
    //console.debug(
    //  'time is: ' + this._date.getUTCHours() + ':' + this._date.getUTCMinutes() + ':' + this._date.getUTCSeconds()
    //);
    const maxAngle = Math.PI / 32;
    const fade = elevation / maxAngle;

    // sun rise
    if (isRising && elevation >= 0 && elevation <= maxAngle) {
      sun.intensity = fade;
    }

    if (!isRising && elevation <= maxAngle && elevation >= 0) {
      sun.intensity = fade;
    }

    if (elevation < 0) {
      sun.intensity = 0;
    } else if (elevation > maxAngle) {
      sun.intensity = 1;
    }

    sun.light!.intensity = sun.intensity;
    const ambient = sun.ambientDayTime
      .clone()
      .multiplyScalar(sun.intensity)
      .add(sun.ambientNightTime.clone().multiplyScalar(1 - sun.intensity));
    sun.ambientLight.color.set(ambient.x, ambient.y, ambient.z);

    this._lastElevate = elevation;
  }

  private updateSunPosition(sun: SunLightComponent, followTransform: TransformComponent): void {
    const focusPoint = followTransform.position;
    const angles = this.sunPosition(this._time, this._latitude, this._longitude);
    sun.azimuth = angles.azimuth;
    sun.elevation = angles.elevation;

    const x = Math.cos(angles.elevation) * Math.sin(angles.azimuth);
    const y = Math.sin(angles.elevation);
    const z = Math.cos(angles.elevation) * Math.cos(angles.azimuth);
    this._sunOffset.set(x, y, z).multiplyScalar(sun.shadowFar / 2);

    sun.light!.position.copy(focusPoint).add(this._sunOffset);
    sun.target!.position.copy(focusPoint);

    sun.target!.updateMatrixWorld();
  }

  private updateShadowCamera(sun: SunLightComponent, followTransform: TransformComponent): void {
    const shadowCamera = sun.light!.shadow.camera as THREE.OrthographicCamera;

    const shadowCamPosition = this.getLocationBetweenSunAndTarget(sun, followTransform);

    shadowCamera.position.copy(shadowCamPosition); //followTransform.position);

    // Optional: reduce shadow shimmering by snapping to shadow texels
    const texelSize = (sun.shadowSize * 2) / sun.shadowMapSize;

    shadowCamera.position.x = Math.floor(shadowCamera.position.x / texelSize) * texelSize;

    shadowCamera.position.z = Math.floor(shadowCamera.position.z / texelSize) * texelSize;

    shadowCamera.updateProjectionMatrix();
  }

  private configureShadowCamera(sun: SunLightComponent): void {
    const shadowCamera = sun.light!.shadow.camera as THREE.OrthographicCamera;
    const size = sun.shadowSize;

    shadowCamera.left = -size;
    shadowCamera.right = size;
    shadowCamera.top = size;
    shadowCamera.bottom = -size;

    shadowCamera.near = sun.shadowNear;
    shadowCamera.far = sun.shadowFar;

    shadowCamera.updateProjectionMatrix();
  }

  private getCameraTransform(world: World): TransformComponent | undefined {
    for (const [, transform] of world.query(CameraComponent, TransformComponent)) {
      return transform;
    }

    return undefined;
  }

  private getLocationBetweenSunAndTarget(sun: SunLightComponent, followTransform: TransformComponent): THREE.Vector3 {
    const sunPos = sun.light?.position.clone();
    if (!sunPos) {
      return new THREE.Vector3();
    }
    const toSun = sunPos.sub(followTransform.position).normalize();
    const newPosition = followTransform.position.clone();
    newPosition.add(toSun.multiplyScalar(10));
    return newPosition;
  }

  private getPlayerTransform(world: World): TransformComponent | undefined {
    for (const [, transform] of world.query(PlayerComponent, TransformComponent)) {
      return transform;
    }

    return undefined;
  }

  /**
   * Calculate the sun's position (azimuth and elevation) based on the given time, latitude, and longitude.
   * @param time - UTC timestamp in milliseconds since the Unix epoch
   * @param lat
   * @param lon
   * @returns
   */
  private sunPosition(
    time: number,
    lat: number,
    lon: number
  ): {
    azimuth: number;
    elevation: number;
  } {
    const rad = Math.PI / 180;

    const JD = time / MillisecondsInDay + 2440587.5;
    const T = (JD - 2451545.0) / 36525;

    let L = 280.46646 + 36000.76983 * T;
    let M = 357.52911 + 35999.05029 * T;

    L %= 360;

    const C =
      (1.914602 - 0.004817 * T) * Math.sin(M * rad) +
      0.019993 * Math.sin(2 * M * rad) +
      0.000289 * Math.sin(3 * M * rad);

    const lambda = (L + C) * rad;

    const epsilon = (23.439291 - 0.0130042 * T) * rad;

    const decl = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

    const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));

    const GMST = 280.46061837 + 360.98564736629 * (JD - 2451545);

    const LST = (GMST + lon) * rad;

    const H = LST - ra;

    const phi = lat * rad;

    const elevation = Math.asin(Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H));

    const azimuth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(decl) * Math.cos(phi));

    return {
      azimuth: (azimuth + 2 * Math.PI) % (2 * Math.PI),
      elevation: elevation,
    };
  }
}
