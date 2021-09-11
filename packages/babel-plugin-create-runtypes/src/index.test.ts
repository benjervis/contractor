import dedent from 'dedent';

import { withRecast } from './';

describe('createRuntypesPlugin', () => {
  it('should handle primitive types and add runtypes import', () => {
    const result = withRecast(dedent`
      export type SampleString = string;
      export type SampleNum = number;
      export type SampleBool = boolean;
    `);

    expect(result).toBe(dedent`
      import * as t from "runtypes";
      export const SampleString = t.String;
      export const SampleNum = t.Number;
      export const SampleBool = t.Boolean;
    `);
  });
});
