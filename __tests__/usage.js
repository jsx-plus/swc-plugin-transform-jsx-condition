const swc = require('@swc/core')
const path = require('path')
const fs = require('fs');
const JSXConditionTransformPlugin = require(path.join(__dirname, '../lib/index.js')).default;

describe('', () => {
  const fixturesDir = path.join(__dirname, '__fixtures__');
  fs.readdirSync(fixturesDir).map((caseName) => {
    it(`should ${caseName.split('-').join(' ')}`, () => {
      const fixtureDir = path.join(fixturesDir, caseName);
      const actualPath = path.join(fixtureDir, 'actual.js');
      const actualCode = fs.readFileSync(actualPath, {encoding: 'utf-8'});
      const expectedCode = fs.readFileSync(path.join(fixtureDir, 'expected.js'), { encoding: 'utf-8' });

      const transformedOutput = swc.transformSync(actualCode, {
        jsc: {
          parser: {
            jsx: true
          },
        },
        plugin: JSXConditionTransformPlugin
      });

      expect(transformedOutput.code.trim()).toBe(expectedCode.trim());
    });
  });
});
