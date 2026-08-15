import * as THREE from 'three';
import { soundManifest, type SoundBus } from './SoundManifest';
import type { SoundId } from './SoundIds';

export interface PlaySoundOptions {
  volume?: number;
  playbackRate?: number;
  echo?: EchoOptions;
}

export interface EchoOptions {
  delay?: number;
  feedback?: number;
  mix?: number;
}

export interface AudioPlayback {
  play(soundId: SoundId, options?: PlaySoundOptions): boolean;
}

export class AudioManager implements AudioPlayback {
  private readonly context: AudioContext;
  private readonly masterGain: GainNode;
  private readonly busGains: Record<SoundBus, GainNode>;
  private readonly activeInstances = new Map<SoundId, number>();
  private unlockInstalled = false;

  constructor(private readonly getSound: (path: string) => AudioBuffer) {
    this.context = THREE.AudioContext.getContext();
    this.masterGain = this.context.createGain();
    this.busGains = {
      effects: this.context.createGain(),
      ui: this.context.createGain(),
      music: this.context.createGain(),
    };

    for (const gain of Object.values(this.busGains)) {
      gain.connect(this.masterGain);
    }
    this.masterGain.connect(this.context.destination);
  }

  installUnlockListeners(target: Window = window): void {
    if (this.unlockInstalled) {
      return;
    }
    this.unlockInstalled = true;

    const unlock = () => {
      void this.resume();
      target.removeEventListener('pointerdown', unlock);
      target.removeEventListener('keydown', unlock);
    };
    target.addEventListener('pointerdown', unlock, { once: true });
    target.addEventListener('keydown', unlock, { once: true });
  }

  async resume(): Promise<void> {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  play(soundId: SoundId, options: PlaySoundOptions = {}): boolean {
    const definition = soundManifest[soundId];
    const activeCount = this.activeInstances.get(soundId) ?? 0;
    if (activeCount >= definition.maxInstances) {
      return false;
    }

    let buffer: AudioBuffer;
    try {
      buffer = this.getSound(definition.path);
    } catch (error) {
      console.warn(`Unable to play unloaded sound: ${soundId}`, error);
      return false;
    }

    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    source.playbackRate.value = options.playbackRate ?? 1;
    gain.gain.value = options.volume ?? 1;
    source.connect(gain);

    const busGain = this.busGains[definition.bus];
    const effectNodes: AudioNode[] = [];
    let echoTailSeconds = 0;
    if (options.echo) {
      const delaySeconds = THREE.MathUtils.clamp(options.echo.delay ?? 0.2, 0.01, 2);
      const feedbackAmount = THREE.MathUtils.clamp(options.echo.feedback ?? 0.3, 0, 0.9);
      const mix = THREE.MathUtils.clamp(options.echo.mix ?? 0.25, 0, 1);
      const delay = this.context.createDelay(2);
      const feedbackGain = this.context.createGain();
      const wetGain = this.context.createGain();
      const dryGain = this.context.createGain();

      delay.delayTime.value = delaySeconds;
      feedbackGain.gain.value = feedbackAmount;
      wetGain.gain.value = mix;
      dryGain.gain.value = 1 - mix;

      gain.connect(dryGain);
      dryGain.connect(busGain);
      gain.connect(delay);
      delay.connect(feedbackGain);
      feedbackGain.connect(delay);
      delay.connect(wetGain);
      wetGain.connect(busGain);

      effectNodes.push(delay, feedbackGain, wetGain, dryGain);
      echoTailSeconds = this.getEchoTailSeconds(delaySeconds, feedbackAmount);
    } else {
      gain.connect(busGain);
    }

    this.activeInstances.set(soundId, activeCount + 1);
    source.addEventListener('ended', () => {
      const remaining = (this.activeInstances.get(soundId) ?? 1) - 1;
      if (remaining > 0) {
        this.activeInstances.set(soundId, remaining);
      } else {
        this.activeInstances.delete(soundId);
      }
      source.disconnect();
      globalThis.setTimeout(() => {
        gain.disconnect();
        for (const node of effectNodes) {
          node.disconnect();
        }
      }, echoTailSeconds * 1000);
    });
    source.start();
    return true;
  }

  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = THREE.MathUtils.clamp(volume, 0, 1);
  }

  setBusVolume(bus: SoundBus, volume: number): void {
    this.busGains[bus].gain.value = THREE.MathUtils.clamp(volume, 0, 1);
  }

  private getEchoTailSeconds(delaySeconds: number, feedback: number): number {
    if (feedback <= 0) {
      return delaySeconds;
    }
    const repetitionsUntilSilent = Math.ceil(Math.log(0.001) / Math.log(feedback));
    return Math.min(delaySeconds * repetitionsUntilSilent, 10);
  }
}
