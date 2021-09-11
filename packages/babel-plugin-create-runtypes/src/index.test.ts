import pluginTester, { TestObject } from 'babel-plugin-tester/pure';

import plugin from './';

const tests: TestObject[] = [
  {
    title: 'Basic type with primitive',
    code: `
      export type SampleString = string;
    `,
    output: `
      export const SampleString = t.String;
    `,
  },
  {
    title: 'Basic type with runtypes import',
    code: `
      export type SampleString = string;
    `,
    output: `
      import * as t from 'runtypes';
      
      export const SampleString = t.String;
    `,
  },
];

pluginTester({
  pluginName: 'babel-plugin-create-runtypes',
  plugin,
  babelOptions: {
    filename: 'test-file.tsx',
    plugins: [['@babel/plugin-syntax-typescript']],
  },
  tests,
});
