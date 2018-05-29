export default class TimeSpan {
  constructor(private milliseconds: number) {}

  formatAsSeconds() {
    return `${this.milliseconds / 1000}s`;
  }

  toString() {
    return this.formatAsSeconds();
  }

  static since(startTimeMs: number) {
    const now = Date.now();
    return new TimeSpan(now - startTimeMs);
  }

  static between(startTimeMs: number, endTimeMs: number) {
    return new TimeSpan(endTimeMs - startTimeMs);
  }
}
