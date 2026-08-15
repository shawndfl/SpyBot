import { SoundIds, type SoundId } from './SoundIds';

export type SoundBus = 'effects' | 'ui' | 'music';

export interface SoundDefinition {
  path: string;
  bus: SoundBus;
  maxInstances: number;
}

export const soundManifest: Record<SoundId, SoundDefinition> = {
  [SoundIds.goldCollect]: {
    path: 'sounds/gold_sack.wav',
    bus: 'effects',
    maxInstances: 4,
  },
  [SoundIds.footstepsGrass]: {
    path: 'sounds/grassFootStep.ogg',
    bus: 'effects',
    maxInstances: 4,
  },
};

export const initialSoundPaths = [...new Set(Object.values(soundManifest).map((sound) => sound.path))];
