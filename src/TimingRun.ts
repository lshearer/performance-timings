import 'console.table';
import { ensureDir, pathExists } from 'fs-extra';
import { resolve } from 'path';
import Build from './Build';
import { Timing } from './Timing';
import { Config } from './config';
import { clone, pull } from './git';

export interface TimingRunOptions {
  workingCloneDirectory: string;
}

export interface ClonedRepo {
  branch: string;
  path: string;
}

export default class TimingRun {
  constructor(private options: TimingRunOptions) {}

  async start(config: Config): Promise<any> {
    // this.checkNodeVersion();

    console.log('Starting with config:', config);

    const repos = await this.setUpTempClones(config);

    const timingsMap = new Map<ClonedRepo, Timing[]>();

    for (let repo of repos) {
      timingsMap.set(repo, await this.getTimings(repo));
    }

    this.logTimings(timingsMap);
  }

  private async setUpTempClones(config: Config): Promise<ClonedRepo[]> {
    const { workingCloneDirectory } = this.options;

    const clonedRepos: ClonedRepo[] = [];

    for (let branch of config.branches) {
      const destination = resolve(workingCloneDirectory, branch);
      const exists = await pathExists(destination);

      if (!exists) {
        // Need to clone repo with selected branch
        await ensureDir(destination);
        await clone(config.repo, destination, branch);
      } else {
        // Need to pull branch to ensure it's up to date
        await pull(destination);
      }
      clonedRepos.push({
        branch,
        path: destination,
      });
    }

    return clonedRepos;
  }

  private async getTimings(repo: ClonedRepo) {
    const build = new Build(repo);
    const timings = [];
    timings.push(await build.install());
    // timings.push(await build.build());
    timings.push(...(await build.watch()));
    return timings;
  }

  private checkNodeVersion() {
    if (!/^v10\./.test(process.version)) {
      throw new Error(
        'Not running Node version 10. Formatting of results will fail.'
      );
    }
  }

  private logTimings(timingMap: Map<ClonedRepo, Timing[]>) {
    const logDataForNativeConsoleTable = Array.from(timingMap).reduce(
      (data, item) => {
        const [repo, timings] = item;

        const timingData = timings.reduce((acc, timing) => {
          return {
            ...acc,
            [timing.name]: timing.time.formatAsSeconds(),
          };
        }, {});

        return {
          ...data,
          [repo.branch]: timingData,
        };
      },
      {}
    );

    const logDataForNpmConsoleTable = Array.from(timingMap).map(item => {
      const [repo, timings] = item;

      const timingData = timings.reduce((acc, timing) => {
        return {
          ...acc,
          [timing.name]: timing.time.formatAsSeconds(),
        };
      }, {});

      return {
        branch: repo.branch,
        ...timingData,
      };
    }, {});

    console.table(logDataForNpmConsoleTable);
  }
}
