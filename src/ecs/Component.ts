export abstract class Component {
  abstract get mask(): number;
  public name?: string;
  destroy(): void {}
}
