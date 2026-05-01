export abstract class Component {
  abstract get mask(): number;
  public name?: string;
  setName(name: string): Component {
    this.name = name;
    return this;
  }
  destroy(): void {}
}
