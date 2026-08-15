import { GoldCollectibleComponent } from '../components/GoldCollectibleComponent';
import { PlayerComponent } from '../components/PlayerComponent';
import { TransformComponent } from '../components/TransformComponent';
import type { UpdateEvent } from '../core/UpdateEvent';
import { System } from '../ecs/System';
import { PlayerProgressResource } from '../procedural/resources/PlayerProgressResource';
import { SoundIds } from '../audio/SoundIds';
import { PlaySoundEvent } from '../events/PlaySoundEvent';

/**
 * This system allows the player to pickup gold
 */
export class GoldCollectionSystem extends System {
  update({ world, commands, events }: UpdateEvent): void {
    const playerResult = world.query(PlayerComponent, TransformComponent).next();
    if (playerResult.done || !world.resources.hasResource(PlayerProgressResource)) {
      return;
    }

    const [, playerTransform] = playerResult.value;
    const progress = world.resources.getResource(PlayerProgressResource);

    for (const [entity, gold, transform] of world.queryWithEntity(GoldCollectibleComponent, TransformComponent)) {
      if (playerTransform.position.distanceToSquared(transform.position) > gold.collectionRadius ** 2) {
        continue;
      }

      if (progress.collectGold(gold.goldId, gold.amount)) {
        events.emit(
          new PlaySoundEvent(SoundIds.goldCollect, {
            volume: 0.8,
            echo: {
              delay: 0.12,
              feedback: 0.25,
              mix: 0.2,
            },
          }),
        );
        commands.destroy(world, entity);
      }
    }
  }
}
