import { SoundIds } from '../audio/SoundIds';
import { CameraComponent } from '../components/CameraComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { GameInputEvent } from '../events/GameInputEvent';
import { PlaySoundEvent } from '../events/PlaySoundEvent';

export interface PlayerFootstepOptions {
  stepInterval?: number;
  volume?: number;
}

export class PlayerFootstepSystem extends System {
  private readonly stepInterval: number;
  private readonly volume: number;
  private timeUntilNextStep = 0;
  private stepIndex = 0;

  constructor(options: PlayerFootstepOptions = {}) {
    super();
    this.stepInterval = options.stepInterval ?? 0.42;
    this.volume = options.volume ?? 0.55;
  }

  update({ world, dt, events }: UpdateEvent): void {
    const [inputEvent] = events.get(GameInputEvent);
    const debugCameraActive = [...world.query(CameraComponent)].some(([camera]) => camera.debugMode);
    const isWalking =
      !!inputEvent &&
      !debugCameraActive &&
      (Math.abs(inputEvent.payload.state.moveX) > 0.001 || Math.abs(inputEvent.payload.state.moveY) > 0.001);

    if (!isWalking) {
      this.timeUntilNextStep = 0;
      return;
    }

    this.timeUntilNextStep -= dt;
    if (this.timeUntilNextStep > 0) {
      return;
    }

    const playbackRate = this.stepIndex % 2 === 0 ? 0.97 : 1.03;
    events.emit(
      new PlaySoundEvent(SoundIds.footstepsGrass, {
        volume: this.volume * 0.25,
        playbackRate,
      }),
    );
    this.stepIndex++;
    this.timeUntilNextStep += this.stepInterval;
  }
}
