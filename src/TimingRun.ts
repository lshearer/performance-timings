import { ensureDir, pathExists } from 'fs-extra';
import { resolve } from 'path';
import Build from './Build';
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
      await this.getTimings(repo);
    }
  }

  private async setUpTempClones(config: Config): Promise<ClonedRepo[]> {
    const { workingCloneDirectory } = this.options;
    // await remove(workingCloneDirectory);

    const clonedRepos: ClonedRepo[] = [];

    for (let branch of config.branches) {
      const destination = resolve(workingCloneDirectory, branch);
      const exists = await pathExists(destination);

      if (!exists) {
        // Need to clone repo with selected branch
        await ensureDir(destination);
        await clone(config.repo, destination, branch);
      } else {
        // Need to checkout branch to ensure it's up to date
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
    const { buildTime, watchTimes } = await this.runBuild(repo);
    console.log(`Built in ${buildTime / 1000}s`);
    console.log(`Watch results:`, watchTimes);
  }

  private async runBuild(repo: ClonedRepo) {
    const build = new Build(repo);
    await build.install();

    const startTime = Date.now();
    await build.run();
    const endTime = Date.now();
    const buildTime = endTime - startTime;

    const times = await build.watch();
    return { buildTime, watchTimes: times };
  }
}
