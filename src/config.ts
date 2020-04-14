export interface Config {
  repo: string;
  branches: string[];
}

export default {
  repo: '../hudl-videospa',
  branches: [
    // 'lyle-experiment-master',
    // 'lyle-experiment-webpack4',
    'lyle-experiment-webpack4-hardsource',
    // 'lyle-experiment-webpack4-autodll',
    'lyle-experiment-hard-source',
  ],
} as Config;
