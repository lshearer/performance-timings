import chalk from 'chalk';
import webpack from 'webpack';
import { TimingEventLogger } from './TimingEvent';
import { defaultRelativeTestFilePath, isTestRun } from './testRun';

const pluginName = 'PerformanceTimingPlugin';

export default class PerformanceTimingPlugin {
  private eventLogger: TimingEventLogger = new TimingEventLogger();

  apply(compiler: webpack.Compiler) {
    console.log(`node version:${process.version}`);

    if (compiler.options.watch) {
      this.applyWatch(compiler);
    } else {
      this.applyBuild(compiler);
    }
    this.applyTestEntryPoints(compiler);
  }

  applyWatch(compiler: webpack.Compiler) {
    let buildCount = 0;
    const watchRun = () => {
      buildCount++;
      this.eventLogger.watchCompileStart(buildCount);
    };

    let doneCount = 0;
    const done = (stats: webpack.Stats) => {
      doneCount++;
      this.eventLogger.watchCompileDone(doneCount);
    };

    if (compiler.hooks) {
      compiler.hooks.watchRun.tap(pluginName, watchRun);
      compiler.hooks.done.tap(pluginName, done);
    } else {
      compiler.plugin('watch-run', (compiler, callback) => {
        watchRun();
        callback();
      });
      compiler.plugin('done', stats => {
        done(stats);
      });
    }
  }

  applyBuild(compiler: webpack.Compiler) {
    const beforeRun = (compilation: webpack.compilation.Compilation) => {
      this.eventLogger.buildStart();
    };

    const done = (stats: webpack.Stats) => {
      this.eventLogger.buildDone();
    };

    if (compiler.hooks) {
      compiler.hooks.beforeRun.tap(pluginName, beforeRun);
      compiler.hooks.done.tap(pluginName, done);
    } else {
      compiler.plugin('before-run', (compilation, callback) => {
        beforeRun(compilation);
        callback();
      });
      compiler.plugin('done', stats => {
        done(stats);
      });
    }
  }

  applyTestEntryPoints(compiler: webpack.Compiler) {
    if (isTestRun()) {
      console.log(chalk.yellow('Using test entry point configuration'));
      compiler.options.entry = {
        test: process.env.TEST_RUN_FILE || defaultRelativeTestFilePath,
      };
    }
  }
}
