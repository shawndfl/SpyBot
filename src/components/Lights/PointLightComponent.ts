import { LightComponent, LightType } from './LightComponent';

export class PointLightComponent extends LightComponent {
  constructor(init?: Partial<PointLightComponent>) {
    super({ type: LightType.point, ...init });
  }
}
