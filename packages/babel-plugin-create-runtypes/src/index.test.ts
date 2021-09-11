import pluginTester, {TestObject} from 'babel-plugin-tester/pure';

import plugin from './';

const tests: TestObject[] = [
  {
    title: 'Basic type with primitive',
    code: `
      export type SampleString = string;
    `,
    output: `
      import * as t from 'runtypes';
      export const SampleString = t.String;

      export type SampleString = t.Static<typeof SampleString>
    `
  },
]

pluginTester({
  pluginName: 'babel-plugin-create-runtypes',
  plugin,
  babelOptions: {
    filename: 'test-file.tsx',
    plugins: [
      ['@babel/plugin-syntax-typescript'],
    ],
  },
  tests,
});