export class RandomWalkGenerator {
  private readonly bias: number;
  private last: number = 0;
  private i: number = 0;
  constructor(bias: number = 0.01) {
    this.bias = bias;
    this.reset();
  }

  public reset() {
    this.i = 0;
    this.last = 3520;
  }

  public getRandomWalkSeries(count: number): number[] {
    const yValues: number[] = [];
    for (let i = 0; i < count; i++) {
      const next: number = this.last + (Math.random() - 0.5 + this.bias);
      yValues.push(next);
      this.last = next;
    }

    return yValues;
  }
}
