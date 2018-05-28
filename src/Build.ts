import { readFile, writeFile } from 'fs-extra';
import { join } from 'path';
import Command from './Command';
import { ClonedRepo } from './TimingRun';
import {
  TimingEvent,
  TimingEventParser,
  TimingEventType,
} from './build-resources/TimingEvent';
import addBuildResourcesPath from './build-resources/addBuildResourcesPath';

addBuildResourcesPath();

export default class Build {
  constructor(private repo: ClonedRepo) {}

  async install() {
    console.log('yarn install');
    await new Command({
      cmd: 'yarn',
      args: ['install'],
      relativePath: 'Hudl.Videospa.Webapp/VideoSPA_UI',
    }).exec(this.repo);
  }

  async run() {
    await new Command({
      cmd: 'yarn',
      args: ['build'],
      relativePath: 'Hudl.Videospa.Webapp/VideoSPA_UI',
    }).exec(this.repo);
  }

  async watch() {
    let finished = false;
    const times: TimingEvent[] = [];
    const parser = new TimingEventParser();
    try {
      await new Command({
        cmd: 'yarn',
        args: ['watch'],
        onOutput: (output, command) => {
          const event = parser.tryParseEvent(output);
          if (!event) {
            return;
          }

          times.push(event);

          // const timings = /\[PerformanceTimingPlugin\] \[(\d+)\] \[.*?] \[(.*?)\] \[(.*)\]/.exec(
          //   output
          // );
          // if (timings == null) {
          //   return;
          // }

          // const [, rawTime, type, rawData] = timings;
          // // if (!output.includes('PerformanceTimingPlugin')) {
          // //   return;
          // // }
          // // if (output.includes)

          // const data = JSON.parse(rawData);
          // const time = parseInt(rawTime, 10);
          // // Log all parsed events
          // times.push({
          //   time,
          //   event: type,
          //   data,
          // });

          if (event.type === TimingEventType.WatchCompileDone) {
            if (event.data === 1) {
              // Update a file to trigger a rebuild
              this.updateFile(
                'Hudl.Videospa.Webapp/VideoSPA_UI/source/app/test.jsx',
                contents => {
                  return contents + `// Trigger file change ${Date.now()}\n`;
                }
              );
            } else if (event.data === 2) {
              // Files have been rebuilt.  Stop the watch process
              finished = true;
              command.kill();
            }
          }
        },
        relativePath: 'Hudl.Videospa.Webapp/VideoSPA_UI',
      }).exec(this.repo);
    } catch (e) {
      if (!finished) {
        throw e;
      }
    }

    const compileTimes = [];
    for (let timing of times) {
      if (timing.type === TimingEventType.WatchCompileStart) {
        const startTime = timing.time;
        const endLog = times.find(
          e =>
            e.type === TimingEventType.WatchCompileDone &&
            e.data === timing.data
        );
        if (!endLog) {
          throw new Error(
            `Missing end log for watch compile: ${JSON.stringify(endLog)}`
          );
        }
        const time = endLog.time - startTime;
        compileTimes.push({
          compileNumber: timing.data,
          time,
        });
      }
    }
    return compileTimes;
  }

  private async updateFile(
    relativePath: string,
    updateContent: (content: string) => string
  ) {
    const path = join(this.repo.path, relativePath);
    const contents = await readFile(path, 'utf8');

    await writeFile(path, updateContent(contents));
  }
}
