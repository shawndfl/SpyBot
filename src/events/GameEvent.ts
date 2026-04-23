export type EventCtor<T extends GameEvent = GameEvent> = new (...args: any[]) => T;

export abstract class GameEvent {
  public abstract get type(): string;

  constructor() {}
}
