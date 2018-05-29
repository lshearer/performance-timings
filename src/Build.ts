import chalk from 'chalk';
import { readFile, writeFile } from 'fs-extra';
import { join } from 'path';
import Command from './Command';
import TimeSpan from './TimeSpan';
import Timer from './Timer';
import { Timing } from './Timing';
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

  async install(): Promise<Timing> {
    return {
      name: 'yarn install',
      time: await Timer.for(() =>
        new Command({
          cmd: 'yarn',
          args: ['install'],
          relativePath: 'Hudl.Videospa.Webapp/VideoSPA_UI',
        }).exec(this.repo)
      ),
    };
  }

  async build(): Promise<Timing> {
    return {
      name: 'Build',
      time: await Timer.for(() =>
        new Command({
          cmd: 'yarn',
          args: ['build'],
          relativePath: 'Hudl.Videospa.Webapp/VideoSPA_UI',
        }).exec(this.repo)
      ),
    };
  }

  async watch() {
    let finished = false;
    const events: TimingEvent[] = [];
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

          events.push(event);

          if (event.type === TimingEventType.WatchCompileDone) {
            if (event.count === 1) {
              // Update a file to trigger a rebuild
              // Using timeout for clearer logging
              this.updateFile(
                'Hudl.Videospa.Webapp/VideoSPA_UI/source/app/test.jsx',
                contents => {
                  return contents + `// Trigger file change ${Date.now()}\n`;
                }
              );
            } else if (event.count === 2) {
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

    const compileTimes: Timing[] = [];
    for (let event of events) {
      if (event.type === TimingEventType.WatchCompileStart) {
        const count = event.count;
        const endEvent = events.find(
          ev =>
            ev.type === TimingEventType.WatchCompileDone && ev.count === count
        );
        if (!endEvent) {
          throw new Error(
            `Missing matching ${
              TimingEventType.WatchCompileDone
            } event log for event: ${JSON.stringify(event)}`
          );
        }

        compileTimes.push({
          name: `Watch compilation (${event.count})`,
          time: TimeSpan.between(event.time, endEvent.time),
        });
      }
    }
    return compileTimes;
  }

  private async updateFile(
    relativePath: string,
    updateContent: (content: string) => string
  ) {
    console.log(chalk.grey(`Updating file ${relativePath}`));

    const path = join(this.repo.path, relativePath);
    const contents = await readFile(path, 'utf8');
    await writeFile(path, updateContent(contents));
  }
}
