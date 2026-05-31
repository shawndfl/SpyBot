import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

/**
 * This is a template component. It has the mask
 * and a constructor with a partial init argument.
 */
export class GuiDebugComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(GuiDebugComponent);
  }

  gui: GUI = new GUI();

  constructor(init?: Partial<GuiDebugComponent>) {
    super();
    Object.assign(this, init);

    // start off hidden
    this.gui.hide();
  }
}
