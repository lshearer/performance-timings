import chalk from 'chalk';
import { ChildProcess, SpawnOptions } from 'child_process';
import spawn from 'cross-spawn-promise';
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

class LineBuffer {
  private buffer: string[] = [];

  constructor(private onLine: (line: string) => void) {
    this.onData = this.onData.bind(this);
  }

  onData(data: string | Buffer) {
    const dataString = data.toString();

    const lines = dataString.split('\n');

    while (lines.length) {
      // Always buffer content
      this.buffer.push(lines.shift()!);

      // If there are more "lines" left, then there was a newline separating them, so
      // the buffer needs flushed.
      if (lines.length) {
        this.onLine(this.stripControlCharacters(this.buffer.join('') + '\n'));
        this.buffer = [];
      }
    }
  }

  private stripControlCharacters(lineToWrite: string) {
    // Remove some control characters that aren't needed in non-interactive modes
    // http://ascii-table.com/ansi-escape-sequences-vt-100.php
    const sequencesToRemove = [
      // Clear line
      '\x1b[2K',
      // Clear tabs(?)
      '\x1b[1G',
    ];

    let sequence: string | undefined;
    while (
      (sequence = sequencesToRemove.find(s => lineToWrite.startsWith(s)))
    ) {
      lineToWrite = lineToWrite.substring(sequence.length);
    }
    return lineToWrite;
  }
}

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
    // proc.stdout.on('data', data => {
    //   const dataString = data.toString();
    //   process.stdout.write(indent(data.toString(), '| '));
    // });

    proc.stdout.on(
      'data',
      new LineBuffer(line => process.stdout.write('|  ' + line)).onData
    );
    proc.stderr.on(
      'data',
      new LineBuffer(line => process.stderr.write(chalk.yellow('|  ') + line))
        .onData
    );

    // proc.stderr.on('data', data => {
    //   const dataString = data.toString();
    //   process.stderr.write(indent(data.toString(), chalk.red('| ')));
    // });

    if (onOutput) {
      proc.stdout.on('data', data => {
        onOutput(data.toString(), this);
      });
    }

    console.log(chalk.grey(`$ ${cmd} ${(args || []).join(' ')}`));
    return promise;
  }

  async kill() {
    if (!this.process) {
      throw new Error("Attempting to kill process that hasn't been started");
    }
    this.process.kill();
  }
}
