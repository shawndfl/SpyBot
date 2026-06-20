import { texture } from 'three/tsl';
import { Engine } from '../core/Engine';
import type { GameState } from '../core/GameState';
import type { TransitionContext } from '../core/TransitionContext';
import type { UpdateEvent } from '../core/UpdateEvent';
import type { TransitionRequest } from '../ecs/CommandBuffer';

export class LoadingState implements GameState {
  private _container?: HTMLDivElement;
  private _nextState?: TransitionRequest;

  enter(context?: TransitionContext): void {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.zIndex = '10000';
    container.style.background = '#000';
    container.style.color = '#fff';
    container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    container.style.fontSize = '24px';
    container.style.fontWeight = '500';
    container.style.display = 'flex';
    container.style.alignItems = 'flex-end';
    container.style.justifyContent = 'flex-end';
    container.style.padding = '32px';
    container.style.boxSizing = 'border-box';
    container.textContent = 'Loading...';

    document.body.appendChild(container);
    this._container = container;

    if (context?.assetManifest) {
      const manifest = context.assetManifest;
      const jobs = [
        context?.assetManifest.physics ? Engine.physicsContext.loadPromise : null,
        ...manifest.glbs.map((path) => Engine.assets.preloadGlb(path)),
        ...manifest.sounds.map((path) => Engine.assets.preloadSound(path)),
        ...manifest.textures.map((path) => Engine.assets.preloadTexture(path)),
      ];

      // when everything loads go to the next state
      Promise.all(jobs).then(() => {
        if (context?.nextStateAfterLoading) {
          this._nextState = context.nextStateAfterLoading;
        } else {
          console.error('There is no transition request for this loading state');
        }
      });
    }
  }

  exit(): void {
    this._container?.remove();
    this._container = undefined;
  }

  update({ commands }: UpdateEvent): void {
    if (this._nextState) {
      // go somewhere
      commands.requestTransition(this._nextState);
      this._nextState = undefined;
    }
  }
}
