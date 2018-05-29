import TimeSpan from './TimeSpan';

export default class Timer {
  private startTime?: number;

  private start(): this {
    this.startTime = Date.now();
    return this;
  }

  private elapsed() {
    if (this.startTime === undefined) {
      throw new Error('Cannot call `elapsed` on a timer before it is started.');
    }
    return TimeSpan.since(this.startTime);
  }

  static async for(promiseFunc: () => Promise<any>): Promise<TimeSpan> {
    const timer = new Timer();
    timer.start();
    await promiseFunc();
    return timer.elapsed();
  }
}
