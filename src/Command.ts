import spawn, { CrossSpawnOptions } from 'cross-spawn-promise';
import { spawn as spawn2, SpawnOptions, ChildProcess } from 'child_process';
import { join } from 'path';
import { ClonedRepo } from './TimingRun';

export interface CommandOptions {
  cmd: string;
  args?: string[];
  relativePath?: string;
  onOutput?: (output: string, command: Command) => void;
}

type CrossSpawnPromise = Promise<Uint8Array> & {
  childProcess: ChildProcess;
};

export default class Command {
  private process?: ChildProcess;

  constructor(private options: CommandOptions) {}

  async exec(repo: ClonedRepo) {
    const { relativePath, cmd, args, onOutput } = this.options;
    const cwd = join(repo.path, relativePath || '');
    // cross-spawn is a drop-in replacement, but the TypeScript types don't include all parameters, so referencing
    // this directly
    const spawnOptions: SpawnOptions = { cwd: cwd };
    const promise = spawn(cmd, args || [], spawnOptions) as CrossSpawnPromise;

    const proc = (this.process = promise.childProcess as ChildProcess);
    proc.stdout.on('data', data => {
      process.stdout.write(data);
    });
    proc.stderr.on('data', data => {
      process.stderr.write(data);
    });

    if (onOutput) {
      proc.stdout.on('data', data => {
        onOutput(data.toString(), this);
      });
    }
    return promise;
  }

  async kill() {
    if (!this.process) {
      throw new Error("Attempting to kill process that hasn't been started");
    }
    this.process.kill();
  }
}
