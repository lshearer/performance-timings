import chalk from 'chalk';

export enum TimingEventType {
  WatchCompileStart = 'watch-compile-start',
  WatchCompileDone = 'watch-compile-done',
  BuildStart = 'build-start',
  BuildDone = 'build-done',
}

export interface TimingEventBase {
  type: TimingEventType;
  time: number;
}

export interface WatchCompileStartEvent extends TimingEventBase {
  type: TimingEventType.WatchCompileStart;
  count: number;
}

export interface WatchCompileDoneEvent extends TimingEventBase {
  type: TimingEventType.WatchCompileDone;
  count: number;
}

export interface BuildCompileStartEvent extends TimingEventBase {
  type: TimingEventType.BuildStart;
}

export interface BuildCompileDoneEvent extends TimingEventBase {
  type: TimingEventType.BuildDone;
}

export type TimingEvent =
  | WatchCompileStartEvent
  | WatchCompileDoneEvent
  | BuildCompileDoneEvent
  | BuildCompileStartEvent;

interface TimingEventLog extends TimingEventBase {
  data: any;
}

function deserializeEvent(
  type: TimingEventType,
  time: number,
  data: any
): TimingEvent {
  switch (type) {
    case TimingEventType.WatchCompileStart:
      return {
        type: type,
        time: time,
        count: data,
      };
    case TimingEventType.WatchCompileDone:
      return {
        type: type,
        time: time,
        count: data,
      };
    case TimingEventType.BuildStart:
      return {
        type: type,
        time: time,
      };
    case TimingEventType.BuildDone:
      return {
        type: type,
        time: time,
      };
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

    const [, rawTime, rawType, rawData] = timings;

    const data = JSON.parse(rawData);
    const time = parseInt(rawTime, 10);
    const type = rawType as TimingEventType;

    return deserializeEvent(type, time, data);
  }
}

export class TimingEventLogger {
  private static readonly loggerName: string = 'TimingEventLogger';
  private previousLogTime?: number;

  private log(event: TimingEvent & TimingEventLog) {
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
      time: Date.now(),
      data: count,
      count: count,
    });
  }

  watchCompileDone(count: number) {
    this.log({
      type: TimingEventType.WatchCompileDone,
      time: Date.now(),
      data: count,
      count: count,
    });
  }

  buildStart() {
    this.log({
      type: TimingEventType.BuildStart,
      time: Date.now(),
      data: null,
    });
  }

  buildDone() {
    this.log({
      type: TimingEventType.BuildDone,
      time: Date.now(),
      data: null,
    });
  }
}
