const swc = require('@swc/core')
const path = require('path')
const ConsoleStripper = require(path.join(__dirname, '../lib/index.js')).default;

it('should strip console call', () => {
    const output = swc.transformSync(`console.log('Foo')`, {
        plugin: (m) => (new ConsoleStripper()).visitModule(m),
    });

    expect(output.code.replace(/\n/g, '')).toBe('void 0;')
})
