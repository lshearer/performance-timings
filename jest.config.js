// Using a jest.config.js file instead of package.json to allow multiple projects without duplicating
// the shared pieces of configuration, as well as filtering by project.

const commonConfig = {
  moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
  transform: {
    '^.+\\.(j|t)sx?$': 'babel-jest',
  },
};

function getTestMatch(baseRelativePath) {
  return {
    testMatch: [
      `<rootDir>/${baseRelativePath}/**/__tests__/**/*.(j|t)s?(x)`,
      `<rootDir>/${baseRelativePath}/**/?(*.)test.(j|t)s?(x)`,
    ],
  };
}

let projects = [
  {
    displayName: 'unit',
    ...getTestMatch('src'),
    ...commonConfig,
  },
  {
    displayName: 'integration',
    ...getTestMatch('tests/integration'),
    ...commonConfig,
  },
  {
    displayName: 'configuration',
    ...getTestMatch('tests/configuration'),
    ...commonConfig,
  },
];

// Allow custom filtering by project display name. The jest CLI arg `--projects` apparently only works
// with configurations in subdirectories, not named configurations. This allows us to watch unit tests
// without rerunning all integration tests at the same time.
const projectsFilter = process.env.JEST_PROJECT;
if (!!projectsFilter) {
  projects = projects.filter(project =>
    project.displayName.includes(projectsFilter)
  );
}

const jestConfig = projects.length === 1 ? projects[0] : { projects };

module.exports = jestConfig;
