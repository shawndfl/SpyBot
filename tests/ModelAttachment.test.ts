import * as THREE from 'three';
import { attachModelToNode } from '../src/rendering/ModelAttachment';

describe('attachModelToNode', () => {
  it('parents a model to the named bone with its local transform', () => {
    const player = new THREE.Object3D();
    const hand = new THREE.Bone();
    hand.name = 'mixamorigRightHand';
    player.add(hand);
    const gun = new THREE.Object3D();

    attachModelToNode(player, gun, {
      filename: 'gun.glb',
      parentNodeName: 'mixamorig:RightHand',
      name: 'player-gun',
      position: [1, 2, 3],
      rotation: [0.1, 0.2, 0.3],
      scale: [0.5, 0.5, 0.5],
    });

    expect(gun.parent).toBe(hand);
    expect(gun.name).toBe('player-gun');
    expect(gun.position).toEqual(new THREE.Vector3(1, 2, 3));
    expect(gun.rotation.x).toBeCloseTo(0.1);
    expect(gun.rotation.y).toBeCloseTo(0.2);
    expect(gun.rotation.z).toBeCloseTo(0.3);
    expect(gun.scale).toEqual(new THREE.Vector3(0.5, 0.5, 0.5));
  });

  it('reports a missing attachment node', () => {
    expect(() =>
      attachModelToNode(new THREE.Object3D(), new THREE.Object3D(), {
        filename: 'gun.glb',
        parentNodeName: 'mixamorig:RightHand',
      }),
    ).toThrow('node mixamorig:RightHand was not found in the owner model');
  });
});
