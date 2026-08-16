import { createRoot, type Root } from 'react-dom/client';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { CrosshairView } from '../ui/CrosshairView';

/** Owns the always-visible center-screen aiming reticle for the overworld. */
export class CrosshairSystem extends System {
  private readonly container: HTMLDivElement;
  private readonly root: Root;

  constructor() {
    super();
    this.container = document.createElement('div');
    this.container.className = 'crosshair-root';
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
    this.root.render(<CrosshairView />);
  }

  update(_event: UpdateEvent): void {}

  dispose(): void {
    this.root.unmount();
    this.container.remove();
  }
}
