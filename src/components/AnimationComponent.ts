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
  private currentBlendActions?: [THREE.AnimationAction, THREE.AnimationAction];
  private currentBlendNames?: [string, string];
  isPlaying: boolean = false;
  transitionTime = 0.25;
  firstAnimation?: string;

  constructor(init?: Partial<AnimationComponent>) {
    super();
    Object.assign(this, init);
  }

  setMixer(mixer: THREE.AnimationMixer): AnimationComponent {
    this.mixer = mixer;
    return this;
  }

  setClips(clips: THREE.AnimationClip[]): AnimationComponent {
    this.clips = clips;
    return this;
  }

  playFirst(): void {
    if (this.firstAnimation) {
      this.play(this.firstAnimation);
    }
  }

  play(name: string, fade = this.transitionTime, timeScale = 1): AnimationComponent {
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

    for (const action of this.currentBlendActions ?? []) {
      if (action !== next) {
        action.fadeOut(fade);
      }
    }
    this.currentBlendActions = undefined;
    this.currentBlendNames = undefined;
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(timeScale);

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

  playBlend(
    primaryName: string,
    secondaryName: string,
    secondaryWeight: number,
    fade = this.transitionTime,
  ): AnimationComponent {
    if (!this.mixer) {
      return this;
    }
    const primaryClip = THREE.AnimationClip.findByName(this.clips, primaryName);
    const secondaryClip = THREE.AnimationClip.findByName(this.clips, secondaryName);
    if (!primaryClip || !secondaryClip) {
      return this;
    }

    const primary = this.mixer.clipAction(primaryClip);
    const secondary = this.mixer.clipAction(secondaryClip);
    const blendWeight = THREE.MathUtils.clamp(secondaryWeight, 0, 1);
    const namesMatch =
      this.currentBlendNames?.[0] === primaryName && this.currentBlendNames?.[1] === secondaryName;

    if (!namesMatch) {
      const previouslyActive = new Set<THREE.AnimationAction>([
        ...(this.currentBlendActions ?? []),
        ...(this.currentAction ? [this.currentAction] : []),
      ]);
      for (const action of previouslyActive) {
        if (action !== primary && action !== secondary) {
          action.fadeOut(fade);
        }
      }
      for (const action of [primary, secondary]) {
        action.enabled = true;
        if (!previouslyActive.has(action)) {
          action.reset().fadeIn(fade).play();
        } else {
          action.play();
        }
      }
      this.currentBlendActions = [primary, secondary];
      this.currentBlendNames = [primaryName, secondaryName];
    }

    primary.setEffectiveWeight(1 - blendWeight);
    secondary.setEffectiveWeight(blendWeight);
    this.currentAction = primary;
    this.currentActionName = primaryName;
    this.isPlaying = true;
    return this;
  }

  stop(): AnimationComponent {
    for (const action of this.currentBlendActions ?? []) {
      action.stop();
    }
    if (this.currentAction) {
      this.currentAction.stop();
    }

    this.currentAction = undefined;
    this.currentActionName = undefined;
    this.currentBlendActions = undefined;
    this.currentBlendNames = undefined;
    this.isPlaying = false;

    return this;
  }
}
