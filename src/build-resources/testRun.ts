import { join } from 'path';

export function isTestRun() {
  return process.env.TEST_RUN;
}

export const defaultRelativeTestFilePath = './app/test.jsx';

export function getRepoRelativeTestFilePath() {
  return join(
    'Hudl.Videospa.Webapp/VideoSPA_UI/source',
    defaultRelativeTestFilePath
  );
}
