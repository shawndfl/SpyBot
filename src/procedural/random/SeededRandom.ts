/** Small deterministic random stream with stable named forks. */
export class SeededRandom {
  private state: number;

  constructor(private readonly seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  fork(salt: string): SeededRandom {
    let hash = this.seed >>> 0;
    for (let index = 0; index < salt.length; index++) {
      hash ^= salt.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return new SeededRandom(hash >>> 0);
  }
}
