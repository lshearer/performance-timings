import chalk from 'chalk';

export enum TimingEventType {
  WatchCompileStart = 'watch-compile-start',
  WatchCompileDone = 'watch-compile-done',
  BuildStart = 'build-start',
  BuildDone = 'build-done',
}

export interface TimingEventBase<T> {
  type: TimingEventType;
  time: number;
  data: T;
}

export interface WatchCompileStartEvent extends TimingEventBase<number> {
  type: TimingEventType.WatchCompileStart;
}

export interface WatchCompileDoneEvent extends TimingEventBase<number> {
  type: TimingEventType.WatchCompileDone;
}

export interface BuildCompileStartEvent extends TimingEventBase<null> {
  type: TimingEventType.BuildStart;
}

export interface BuildCompileDoneEvent extends TimingEventBase<null> {
  type: TimingEventType.BuildDone;
}

export type TimingEvent =
  | WatchCompileStartEvent
  | WatchCompileDoneEvent
  | BuildCompileDoneEvent
  | BuildCompileStartEvent;

function deserializeEvent(type: string, time: number, data: any): TimingEvent {
  switch (type) {
    case TimingEventType.WatchCompileStart:
      return {
        type: type,
        data: data,
        time: time,
      };
    case TimingEventType.WatchCompileDone:
      return {
        type: type,
        data: data,
        time: time,
      };
    default:
      throw new Error(`Failed to parse unknown event type: ${type}`);
  }
}

export class TimingEventParser {
  tryParseEvent(log: string): TimingEvent | null {
    const timings = /\[TimingEventLogger\] \[(\d+)\] \[.*?] \[(.*?)\] \[(.*)\]/.exec(
      log
    );
    if (timings == null) {
      return null;
    }

    const [, rawTime, type, rawData] = timings;

    const data = JSON.parse(rawData);
    const time = parseInt(rawTime, 10);

    return deserializeEvent(type, time, data);
  }
}

export class TimingEventLogger {
  private static readonly loggerName: string = 'TimingEventLogger';
  private previousLogTime?: number;

  private log(event: TimingEvent) {
    const logTime = event.time;
    const timeDiff = logTime - (this.previousLogTime || logTime);
    this.previousLogTime = logTime;

    console.log(
      chalk.cyan(
        `[${TimingEventLogger.loggerName}] [${logTime}] [+${timeDiff /
          1000}s] [${event.type}] [${JSON.stringify(event.data || null)}]`
      )
    );
  }

  watchCompileStart(count: number) {
    this.log({
      type: TimingEventType.WatchCompileStart,
      data: count,
      time: Date.now(),
    });
  }

  watchCompileDone(count: number) {
    this.log({
      type: TimingEventType.WatchCompileDone,
      data: count,
      time: Date.now(),
    });
  }

  buildStart() {
    this.log({
      type: TimingEventType.BuildStart,
      data: null,
      time: Date.now(),
    });
  }

  buildDone() {
    this.log({
      type: TimingEventType.BuildDone,
      data: null,
      time: Date.now(),
    });
  }
}
