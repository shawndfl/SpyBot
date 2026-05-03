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
  //private _directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  private _startTime: number = -1;
  private _time: number = -1;
  private _timeScale: number = 1;
  private _latitude: number = LocationOnEarth.latitude;
  private _longitude: number = LocationOnEarth.longitude;
  private _ambientLight: THREE.AmbientLight = new THREE.AmbientLight(0xc0c0c0); // soft white light
  private _sunOffset: THREE.Vector3 = new THREE.Vector3();

  private _isSunUp: boolean = false;

  constructor(componentMask: number, private _scene: THREE.Scene, private _renderer: THREE.WebGLRenderer) {
    super(componentMask);
    this._renderer.toneMappingExposure = 2.0; // try 1.5 to 2.5

    //const ambient = new THREE.AmbientLight(0xffffff, 2.0);
    //this.renderSystem.scene.add(ambient);
    /*
    this._directionalLight.position.set(5, 10, 7.5);

    // setup shadow maps
    this._directionalLight.castShadow = true;
    this._directionalLight.shadow.mapSize.width = 2048;
    this._directionalLight.shadow.mapSize.height = 2048;

    // adjust the shadow camera's size
    const size = 30;
    const shadowCam = this._directionalLight.shadow.camera;
    shadowCam.left = -size;
    shadowCam.right = size;
    shadowCam.top = size;
    shadowCam.bottom = -size;
    this._directionalLight.shadow.camera.near = 0.1; // 10 cm
    this._directionalLight.shadow.camera.far = 200; // 200 m

    const shadowCameraHelper = new THREE.CameraHelper(this._directionalLight.shadow.camera);

    // Add stuff to the scene
    this._scene.add(this._directionalLight);
    this._scene.add(shadowCameraHelper);
    
    */

    this._scene.add(this._ambientLight);
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

  /*
  private updateSunPosition_old(dt: number, cameraLocation: THREE.Vector3, sunComponent: SunLightComponent): void {
    const step = dt * 1000 * this._timeScale;
    this._time += step;
    //this._time = 1767271432400; // sun rise
    const angles = this.sunPosition(this._time, this._latitude, this._longitude);
    sunComponent.azimuth = angles.azimuth;
    sunComponent.elevation = angles.elevation;

    const x = Math.cos(angles.elevation) * Math.sin(angles.azimuth);
    const y = Math.sin(angles.elevation);
    const z = Math.cos(angles.elevation) * Math.cos(angles.azimuth);

    this._directionalLight.position.x = x;
    this._directionalLight.position.y = y;
    this._directionalLight.position.z = z;
    this._directionalLight.position.multiplyScalar(100);
    this._directionalLight.shadow.camera.position.copy(cameraLocation);
    this._directionalLight.shadow.camera.updateProjectionMatrix();
    //this._directionalLight.position.add(cameraLocation);
    this._directionalLight.setRotationFromEuler(new THREE.Euler(angles.azimuth, angles.elevation, 0, 'YXZ'));

    this._isSunUp = angles.elevation < 0 || angles.elevation > Math.PI;

    // is it night time
    if (this._isSunUp) {
      this._ambientLight.color.setRGB(0.5, 0.5, 0.5);
      this._directionalLight.visible = false;
    } else {
      this._ambientLight.color.setRGB(0.5, 0.5, 0.9);
      this._directionalLight.visible = true;
    }

    
    if (!this.renderSystem.scene.environment) {
      const date = new Date(this._time);
      const hours = date.getUTCHours();
      if (hours > 18 && hours < 20) {
        const pmrem = new THREE.PMREMGenerator(this._renderer);
        const envMap = pmrem.fromScene(this.renderSystem.scene).texture;
        this.renderSystem.scene.environment = envMap;
      }
    }
    
  }
  */

  update({ world, dt }: UpdateEvent): void {
    // update time
    const step = dt * 1000 * this._timeScale;
    this._time += step;
    //this._time = 1767271432400; // sun rise

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

      if (sun.helper) {
        sun.helper.update();
      }

      // there should only be one sun
      break;
    }
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

    this.configureShadowCamera(sun);

    // set the start time
    this.setSunState(sun);

    if (sun.debug) {
      sun.helper = new THREE.CameraHelper(light.shadow.camera);
      this._scene.add(sun.helper);
    }
  }

  private updateSunPosition(sun: SunLightComponent, followTransform: TransformComponent): void {
    const focusPoint = followTransform.position;
    const angles = this.sunPosition(this._time, this._latitude, this._longitude);
    sun.azimuth = angles.azimuth;
    sun.elevation = angles.elevation;

    const x = Math.cos(angles.elevation) * Math.sin(angles.azimuth);
    const y = Math.sin(angles.elevation);
    const z = Math.cos(angles.elevation) * Math.cos(angles.azimuth);
    this._sunOffset.set(x, y, z);

    sun.light!.position.copy(focusPoint).add(this._sunOffset);
    sun.target!.position.copy(focusPoint);

    sun.target!.updateMatrixWorld();
  }

  private updateShadowCamera(sun: SunLightComponent, followTransform: TransformComponent): void {
    const shadowCamera = sun.light!.shadow.camera as THREE.OrthographicCamera;

    shadowCamera.position.copy(followTransform.position);

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

  private getPlayerTransform(world: World): TransformComponent | undefined {
    for (const [, transform] of world.query(PlayerComponent, TransformComponent)) {
      return transform;
    }

    return undefined;
  }
}
