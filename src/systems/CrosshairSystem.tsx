import { createRoot, type Root } from 'react-dom/client';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { CrosshairView } from '../ui/CrosshairView';

/** Owns the canvas-centered aiming reticle for the overworld. */
export class CrosshairSystem extends System {
  private readonly container: HTMLDivElement;
  private readonly root: Root;

  constructor(private readonly canvas: HTMLCanvasElement) {
    super();
    this.container = document.createElement('div');
    this.container.className = 'crosshair-root';
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
    this.root.render(<CrosshairView />);
    this.updatePosition();
  }

  update(_event: UpdateEvent): void {
    this.updatePosition();
  }

  private updatePosition(): void {
    const { left, top, width, height } = this.canvas.getBoundingClientRect();
    this.container.style.left = `${left + width / 2}px`;
    this.container.style.top = `${top + height / 2}px`;
  }

  dispose(): void {
    this.root.unmount();
    this.container.remove();
  }
}
