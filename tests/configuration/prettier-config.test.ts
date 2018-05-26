test('lint-staged, format, and format-check globs match', () => {
  const pkg = require('../../package.json');

  const lintStagedGlobs = Object.keys(pkg['lint-staged']);
  expect(lintStagedGlobs).toHaveLength(1);

  function getScriptGlob(scriptName: string) {
    const script = pkg.scripts[scriptName];
    const [, glob] = /"(.+)"/.exec(script) || ([] as string[]);
    return glob;
  }

  const formatGlob = getScriptGlob('format');
  const formatCheckGlob = getScriptGlob('format-check');

  expect(formatGlob).toBeTruthy();
  expect(formatCheckGlob).toBeTruthy();
  expect(lintStagedGlobs[0]).toEqual(formatGlob);
  expect(formatGlob).toEqual(formatCheckGlob);
});
