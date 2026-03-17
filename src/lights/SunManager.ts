import * as THREE from 'three';
import type { UpdateEvent } from '../core/UpdateEvent';
import { GameSky } from '../rendering/Sky';
import type { IRenderSystem } from '../systems/IRenderSystem';
import type { SunLight } from '../components/SunLight';

export const LocationOnEarth = {
  latitude: 28.5383, // latitude (Orlando)
  longitude: -81.3792, // longitude
};

export const MillisecondsInDay = 86400000;

export class SunManager {
  private _directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  private _sky: GameSky;
  private _startTime: number = -1;
  private _time: number = -1;
  private _timeScale: number = 1;
  private _latitude: number = LocationOnEarth.latitude;
  private _longitude: number = LocationOnEarth.longitude;
  private _ambientLight: THREE.AmbientLight = new THREE.AmbientLight(0x808080); // soft white light

  private _isSunUp: boolean = false;

  constructor(private renderSystem: IRenderSystem) {
    this._directionalLight.position.set(5, 10, 7.5);

    // setup shadow maps
    this._directionalLight.castShadow = true;
    this._directionalLight.shadow.mapSize.width = 2048;
    this._directionalLight.shadow.mapSize.height = 2048;
    this._directionalLight.shadow.camera.near = 0.05;
    this._directionalLight.shadow.camera.far = 50;

    this._sky = new GameSky(this.renderSystem.renderer, this.renderSystem.gui);

    // Add stuff to the scene
    this.renderSystem.scene.add(this._directionalLight);
    this.renderSystem.scene.add(this._ambientLight);
    this.renderSystem.scene.add(this._sky.sky);
  }

  initialize(): void {
    this._sky.initialize();
  }

  isSunUp(): boolean {
    return this._isSunUp;
  }

  setSunState(sunLight: SunLight): void {
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

  private updateSunPosition(dt: number): void {
    const step = dt * 1000 * this._timeScale;
    this._time += step;
    const angles = this.sunPosition(this._time, this._latitude, this._longitude);

    const x = Math.cos(angles.elevation) * Math.sin(angles.azimuth);
    const y = Math.sin(angles.elevation);
    const z = Math.cos(angles.elevation) * Math.cos(angles.azimuth);

    this._directionalLight.position.x = x;
    this._directionalLight.position.y = y;
    this._directionalLight.position.z = z;

    this._isSunUp = angles.elevation < 0 || angles.elevation > Math.PI;

    // is it night time
    if (this._isSunUp) {
      this._ambientLight.color.setRGB(0.4, 0.4, 0.7);
      this._directionalLight.visible = false;
    } else {
      this._ambientLight.color.setRGB(0.7, 0.7, 0.7);
      this._directionalLight.visible = true;
    }

    this._sky.setSunPosition(angles.azimuth, angles.elevation);
  }

  update({ world, dt, events, commands }: UpdateEvent): void {
    this.updateSunPosition(dt);
    this._sky.update(dt);
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
