import { Component } from '../../ecs/Component';
import { ComponentRegistry } from '../../ecs/ComponentRegistry';

export interface MeshGlbAttachment {
  filename: string;
  parentNodeName: string;
  name?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  castShadow?: boolean;
  debugBounds?: boolean;
}

export class MeshGlbComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(MeshGlbComponent);
  }

  filename: string = '';
  castShadow?: boolean;
  skeletonMesh?: boolean;
  attachments?: MeshGlbAttachment[];

  constructor(init?: Partial<MeshGlbComponent>) {
    super();
    Object.assign(this, init);
  }
}
