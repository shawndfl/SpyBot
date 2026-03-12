export class Entity {
  private _id: number;
  private _generation: number = 0;

  get id(): number {
    return this._id;
  }

  get generation(): number {
    return this._generation;
  }

  constructor(id: number, generation: number) {
    this._id = id;
    this._generation = generation;
  }
}
