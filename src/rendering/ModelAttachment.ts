import * as THREE from 'three';
import type { MeshGlbAttachment } from '../components/mesh/MeshGlbComponent';

/** Parents a cloned model to a named node and applies its authored local transform. */
export function attachModelToNode(
  ownerModelRoot: THREE.Object3D,
  attachmentModel: THREE.Object3D,
  attachment: MeshGlbAttachment,
): THREE.Object3D {
  const runtimeParentNodeName = THREE.PropertyBinding.sanitizeNodeName(attachment.parentNodeName);
  const parent =
    ownerModelRoot.getObjectByName(attachment.parentNodeName) ?? ownerModelRoot.getObjectByName(runtimeParentNodeName);
  if (!parent) {
    throw new Error(
      `Cannot attach ${attachment.filename}: node ${attachment.parentNodeName} was not found in the owner model`,
    );
  }

  attachmentModel.name = attachment.name ?? attachment.filename;
  attachmentModel.position.fromArray(attachment.position ?? [0, 0, 0]);
  attachmentModel.rotation.set(...(attachment.rotation ?? [0, 0, 0]), 'YXZ');
  attachmentModel.scale.fromArray(attachment.scale ?? [1, 1, 1]);
  parent.add(attachmentModel);
  return attachmentModel;
}
