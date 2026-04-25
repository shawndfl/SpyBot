import * as THREE from 'three';
import { Component } from '../ecs/Component';
import { ComponentRegistry } from '../ecs/ComponentRegistry';

export class AnimationComponent extends Component {
  get mask(): number {
    return ComponentRegistry.getId(AnimationComponent);
  }

  mixer?: THREE.AnimationMixer;
  clips: THREE.AnimationClip[] = [];
  currentAction?: THREE.AnimationAction;
  currentActionName?: string;
  isPlaying: boolean = false;
  transitionTime = 0.25;

  setMixer(mixer: THREE.AnimationMixer): AnimationComponent {
    this.mixer = mixer;
    return this;
  }

  setClips(clips: THREE.AnimationClip[]): AnimationComponent {
    this.clips = clips;
    return this;
  }
  /*
  play(name: string): AnimationComponent {
    if (!this.mixer) {
      return this;
    }

    const clip = THREE.AnimationClip.findByName(this.clips, name);
    if (!clip) {
      return this;
    }

    if (this.currentAction) {
      this.currentAction.stop();
    }

    this.currentAction = this.mixer.clipAction(clip);
    this.currentAction.reset();
    this.currentAction.play();

    this.currentAnimation = name;
    this.isPlaying = true;

    return this;
  }
*/
  play(name: string, fade = this.transitionTime): AnimationComponent {
    if (!this.mixer) {
      return this;
    }
    const clip = THREE.AnimationClip.findByName(this.clips, name);
    if (!clip) {
      return this;
    }

    const next = this.mixer.clipAction(clip);
    if (!next) {
      return this;
    }

    if (this.currentAction === next) {
      return this;
    }

    const prev = this.currentAction;

    this.currentAction = next;
    this.currentActionName = name;

    next.reset();
    next.enabled = true;

    if (prev) {
      prev.crossFadeTo(next, fade, true);
      next.play();
    } else {
      next.fadeIn(fade).play();
    }

    this.isPlaying = true;

    return this;
  }

  stop(): AnimationComponent {
    if (this.currentAction) {
      this.currentAction.stop();
    }

    this.currentAction = undefined;
    this.currentActionName = undefined;
    this.isPlaying = false;

    return this;
  }
}
