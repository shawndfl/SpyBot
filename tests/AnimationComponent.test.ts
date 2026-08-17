import * as THREE from 'three';
import { AnimationComponent } from '../src/components/AnimationComponent';

describe('AnimationComponent', () => {
  it('applies playback speed when starting an animation', () => {
    const clip = new THREE.AnimationClip('Running', 1, []);
    const mixer = new THREE.AnimationMixer(new THREE.Object3D());
    const animation = new AnimationComponent().setMixer(mixer).setClips([clip]);

    animation.play('Running', 0, 1.5);

    expect(animation.currentAction?.getEffectiveTimeScale()).toBe(1.5);
  });

  it('updates playback speed when the requested animation is already playing', () => {
    const clip = new THREE.AnimationClip('Running', 1, []);
    const mixer = new THREE.AnimationMixer(new THREE.Object3D());
    const animation = new AnimationComponent().setMixer(mixer).setClips([clip]);

    animation.play('Running', 0, 1.5);
    animation.play('Running', 0, 0.75);

    expect(animation.currentAction?.getEffectiveTimeScale()).toBe(0.75);
  });
});
