import { resolve } from 'path';
import TimingRun from './TimingRun';
import config from './config';
import indent from './util/indent';

process.env.FORCE_COLOR = 'true';

const workingCloneDirectory = resolve(__dirname, '..', 'workspace');
(async function() {
  try {
    await new TimingRun({ workingCloneDirectory }).start(config);
  } catch (e) {
    console.error(e.toString());
    console.error(e.stack);
    if (e.stdout) {
      console.error('Error stdout:');
      console.error(indent(e.stdout.toString()));
    }
    if (e.stderr) {
      console.error('Error stderr:');
      console.error(indent(e.stderr.toString()));
    }

    process.exit(1);
  }
})();
