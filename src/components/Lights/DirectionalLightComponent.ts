import { LightComponent, LightType } from './LightComponent';

export class DirectionalLightComponent extends LightComponent {
  constructor(init?: Partial<DirectionalLightComponent>) {
    super({ type: LightType.direction, ...init });
  }
}
