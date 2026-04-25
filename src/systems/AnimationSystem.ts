import { AnimationComponent } from '../components/AnimationComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';

export class AnimationSystem extends System {
  update({ world, dt, events, commands }: UpdateEvent): void {
    for (let [animation] of world.query(AnimationComponent)) {
      if (animation.mixer && animation.isPlaying) {
        animation.mixer.update(dt);
      }
    }
  }
}
