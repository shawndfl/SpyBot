import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export interface DialogContentComponentInit {
  title: string;
  text: string;
}

/**
 * Authored dialog displayed when the owning entity is triggered.
 */
export class DialogContentComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(DialogContentComponent);
  }

  title: string;
  text: string;

  constructor(init: DialogContentComponentInit) {
    super();
    this.title = init.title;
    this.text = init.text;
  }
}
