import { createRoot, type Root } from 'react-dom/client';

import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

import { GameInputEvent } from '../events/GameInputEvent';

import { GuiDebugComponent } from '../components/GuiDebugComponent';
import { CameraComponent } from '../components/CameraComponent';
import { TransformComponent } from '../components/TransformComponent';

export class DebugHudSystem extends System {
  private _container: HTMLDivElement;
  //@ts-ignore
  private _root: Root;

  constructor(componentMask: number) {
    super(componentMask);

    this._container = document.createElement('div');
    this._container.className = 'battle-menu-root';

    document.body.appendChild(this._container);

    this._root = createRoot(this._container);
  }

  update({ world, events }: UpdateEvent): void {
    const [inputEvents] = events.get(GameInputEvent);
    const inputState = inputEvents?.payload.state;

    const [[camera, cameraTransform]] = world.query(CameraComponent, TransformComponent);
    const [[guiComponent]] = world.query(GuiDebugComponent);

    if (inputState?.debugModeToggle) {
      guiComponent?.gui.show(guiComponent.gui._hidden);
    }

    // toggle the debug mode and has a gui component
    if (!guiComponent?.gui._hidden && !this.alreadyAdded(guiComponent)) {
      const gui = guiComponent?.gui;

      if (gui && camera) {
        const folder = gui.addFolder('CameraPosition');
        folder.add(cameraTransform.position, 'x').listen().decimals(3);
        folder.add(cameraTransform.position, 'y').listen().decimals(3);
        folder.add(cameraTransform.position, 'z').listen().decimals(3);
        const folder2 = gui.addFolder('CameraDirection');

        const directionDebug = {
          get x() {
            return cameraTransform.worldDirection.x;
          },
          get y() {
            return cameraTransform.worldDirection.y;
          },
          get z() {
            return cameraTransform.worldDirection.z;
          },
        };

        folder2.add(directionDebug, 'x').listen().decimals(3);
        folder2.add(directionDebug, 'y').listen().decimals(3);
        folder2.add(directionDebug, 'z').listen().decimals(3);
      }
    }
  }

  private alreadyAdded(guiComponent: GuiDebugComponent): boolean {
    return !!guiComponent.gui.folders.find((f) => f._title == 'CameraPosition');
  }
}
