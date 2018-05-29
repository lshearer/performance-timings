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
    console.log('Starting with config:', config);

    const repos = await this.setUpTempClones(config);

    for (let repo of repos) {
      const timings = await this.getTimings(repo);
      this.logTimingsForRepo(repo, timings);
    }
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
    timings.push(await build.build());
    timings.push(...(await build.watch()));
    return timings;
  }

  private logTimingsForRepo(repo: ClonedRepo, timings: Timing[]) {
    console.table(
      timings.map(timing => {
        return {
          name: timing.name,
          time: timing.time.formatAsSeconds(),
        };
      })
    );
  }
}
