import { createRoot, type Root } from 'react-dom/client';

import type { UpdateEvent } from '../core/UpdateEvent';
import { DialogComponent } from '../components/DialogComponent';
import { DialogView } from '../ui/DialogView';
import { GameInputEvent } from '../events/GameInputEvent';
import { System } from '../ecs/System';

export class DialogSystem extends System {
  private _container: HTMLDivElement;
  private _root: Root;
  private activeDialog?: DialogComponent;
  private continueRequested = false;

  constructor() {
    super();

    this._container = document.createElement('div');
    this._container.className = 'dialog-root';

    document.body.appendChild(this._container);

    this._root = createRoot(this._container);
  }

  update({ world, dt, events }: UpdateEvent): void {
    const [[dialog]] = world.query(DialogComponent);
    const [inputEvent] = events.get(GameInputEvent);
    const input = inputEvent?.payload.state;

    this.activeDialog = dialog;

    if (!dialog?.visible) {
      this.continueRequested = false;
      this._root.render(null);
      return;
    }

    if (input?.selectJustReleased || input?.attackJustReleased) {
      this.continueRequested = true;
    }

    if (this.continueRequested) {
      this.advance(dialog);
      this.continueRequested = false;
    }

    if (!dialog.isFullyRevealed) {
      dialog.revealedCharacters = Math.min(
        dialog.text.length,
        dialog.revealedCharacters + dialog.charactersPerSecond * dt,
      );
    }

    this._root.render(
      <DialogView
        visible={dialog.visible}
        title={dialog.title}
        text={dialog.text.slice(0, Math.floor(dialog.revealedCharacters))}
        canContinue={dialog.isFullyRevealed}
        onContinue={() => {
          this.continueRequested = true;
        }}
      />,
    );
  }

  showDialog(title: string, text: string, onComplete?: () => void): void {
    this.activeDialog?.show(title, text, onComplete);
  }

  private advance(dialog: DialogComponent): void {
    if (!dialog.isFullyRevealed) {
      dialog.revealedCharacters = dialog.text.length;
      return;
    }

    const onComplete = dialog.onComplete;
    dialog.hide();
    onComplete?.();
  }
}
