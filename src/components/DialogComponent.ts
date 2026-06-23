import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class DialogComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(DialogComponent);
  }

  visible = false;
  title = '';
  text = '';
  revealedCharacters = 0;
  charactersPerSecond = 48;
  onComplete?: () => void;

  constructor(init?: Partial<DialogComponent>) {
    super();
    Object.assign(this, init);
  }

  show(title: string, text: string, onComplete?: () => void): void {
    this.visible = true;
    this.title = title;
    this.text = text;
    this.revealedCharacters = 0;
    this.onComplete = onComplete;
  }

  hide(): void {
    this.visible = false;
    this.onComplete = undefined;
  }

  get isFullyRevealed(): boolean {
    return this.revealedCharacters >= this.text.length;
  }
}
