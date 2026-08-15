export const SoundIds = {
  goldCollect: 'goldCollect',
  footstepsGrass: 'footstepsGrass',
} as const;

export type SoundId = (typeof SoundIds)[keyof typeof SoundIds];
