import { LightComponent, LightType } from './LightComponent';

export class SpotLightComponent extends LightComponent {
  constructor(init?: Partial<SpotLightComponent>) {
    super({ type: LightType.spot, ...init });
  }
}
