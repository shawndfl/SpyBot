import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { MillisecondsInDay } from '../lights/SunManager';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class SunLightComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(SunLightComponent);
  }

  direction: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  ambient: THREE.Vector3 = new THREE.Vector3(0.2, 0.2, 0.2);
  millisecondsInDay: number = MillisecondsInDay;

  /**
   * The time is in Unix Epoch format.
   */
  time: number = Date.now();

  latitude?: number;
  longitude?: number;

  setStartTime(hour: number): SunLightComponent {
    const date = new Date(2026, 0, 1, hour, 0, 0, 0);
    console.debug('time1: ', date.getTime());
    //date.setUTCFullYear(2026, 0, 1);
    //date.setUTCHours(hour, 0, 0, 0);
    //console.debug('time2: ', date.getTime());
    this.time = date.getTime();
    return this;
  }

  /**
   * Set the length of a day in milliseconds. This will affect how fast the sun moves across the sky.
   * @param dayLength
   */
  setDayLengthInMs(dayLength: number): SunLightComponent {
    this.millisecondsInDay = dayLength;
    return this;
  }

  constructor(init?: Partial<SunLightComponent>) {
    super();
    Object.assign(this, init);
  }
}
