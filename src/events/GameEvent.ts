export abstract class GameEvent {
  public get type(): string {
    return this._type;
  }
  constructor(private _type: string) {}
}
