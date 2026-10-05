/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The variables snippet's answer, parsed into the typed model.
 */

import { describe, expect, it } from '@jest/globals';
import {
  KERNEL_VARIABLES_MARKER,
  KernelVariablesError,
  formatBytes,
  inspectKernelVariable,
  kernelVariableExtent,
  listKernelVariables,
  parseKernelVariableDetails,
  parseKernelVariables,
  pythonKernelVariablesCode,
  supportsKernelVariables,
} from '../introspection';

const printed = (payload: unknown, before = '', after = '') =>
  `${before}${KERNEL_VARIABLES_MARKER}${JSON.stringify(payload)}${KERNEL_VARIABLES_MARKER}${after}`;

describe('pythonKernelVariablesCode', () => {
  it('defines the helper, calls it and deletes it', () => {
    const code = pythonKernelVariablesCode();
    expect(code).toContain('def __dl_kernel_variables(');
    expect(code).toContain('__dl_kernel_variables(None, False)');
    expect(code).toContain('del __dl_kernel_variables');
  });

  it('asks for one variable by its name, and modules when asked', () => {
    expect(pythonKernelVariablesCode({ name: 'df' })).toContain(
      '__dl_kernel_variables("df", False)'
    );
    expect(pythonKernelVariablesCode({ modules: true })).toContain(
      '__dl_kernel_variables(None, True)'
    );
  });

  it('refuses anything but an identifier', () => {
    expect(() => pythonKernelVariablesCode({ name: 'a); import os' })).toThrow(
      /Not a variable name/
    );
  });
});

describe('supportsKernelVariables', () => {
  it('knows Python, by any of its names', () => {
    expect(supportsKernelVariables('python')).toBe(true);
    expect(supportsKernelVariables('python3')).toBe(true);
    expect(supportsKernelVariables('Python')).toBe(true);
    expect(supportsKernelVariables('R')).toBe(false);
    expect(supportsKernelVariables(undefined)).toBe(false);
  });
});

describe('parseKernelVariables', () => {
  it('reads the listing between the markers, among other output', () => {
    const variables = parseKernelVariables({
      stdout: printed(
        {
          variables: [
            {
              name: 'a',
              type: 'int',
              module: 'builtins',
              kind: 'scalar',
              preview: '1',
              size: 28,
            },
            {
              name: 'df',
              type: 'DataFrame',
              kind: 'dataframe',
              preview: 'columns: x, y',
              shape: [3, 2],
              size: 166,
            },
            {
              name: 'w',
              type: 'IntSlider',
              kind: 'widget',
              preview: '5',
              model_id: 'abc',
            },
            { name: 'odd', kind: 'not-a-kind', shape: ['x'] },
            { kind: 'scalar' },
          ],
        },
        'something the kernel printed\n',
        '\n'
      ),
    });
    expect(variables.map(v => v.name)).toEqual(['a', 'df', 'w', 'odd']);
    expect(variables[0]).toEqual({
      name: 'a',
      type: 'int',
      module: 'builtins',
      kind: 'scalar',
      preview: '1',
      size: 28,
    });
    expect(variables[1].shape).toEqual([3, 2]);
    expect(variables[2].modelId).toBe('abc');
    // What is not understood is not trusted.
    expect(variables[3]).toEqual({
      name: 'odd',
      type: 'object',
      kind: 'object',
      preview: '',
    });
  });

  it('says why when there is no answer', () => {
    expect(() => parseKernelVariables({ stdout: '' })).toThrow(
      KernelVariablesError
    );
    expect(() =>
      parseKernelVariables({
        stdout: '',
        error: "NameError: name 'x' is not defined",
      })
    ).toThrow(/NameError/);
    expect(() =>
      parseKernelVariables({
        stdout: `${KERNEL_VARIABLES_MARKER}{${KERNEL_VARIABLES_MARKER}`,
      })
    ).toThrow(/not JSON/);
    expect(() =>
      parseKernelVariables({
        stdout: printed({ error: 'There is no variable named b.' }),
      })
    ).toThrow('There is no variable named b.');
  });
});

describe('parseKernelVariableDetails', () => {
  it('reads a variable in full, with what its kind adds', () => {
    const details = parseKernelVariableDetails({
      stdout: printed({
        variable: {
          name: 'df',
          type: 'DataFrame',
          kind: 'dataframe',
          preview: 'columns: x',
          shape: [1, 1],
          repr: '   x\n0  1',
          truncated: false,
          data: { columns: ['x'], index: ['0'], rows: [['1']] },
        },
      }),
    });
    expect(details.repr).toBe('   x\n0  1');
    expect(details.truncated).toBe(false);
    expect(details.data.rows).toEqual([['1']]);
  });
});

describe('listKernelVariables and inspectKernelVariable', () => {
  it('run the snippet through any executor', async () => {
    const sent: string[] = [];
    const execute = async (code: string) => {
      sent.push(code);
      return code.includes('"a"')
        ? {
            stdout: printed({
              variable: {
                name: 'a',
                type: 'int',
                kind: 'scalar',
                preview: '1',
                repr: '1',
                data: {},
              },
            }),
          }
        : {
            stdout: printed({
              variables: [
                { name: 'a', type: 'int', kind: 'scalar', preview: '1' },
              ],
            }),
          };
    };
    expect((await listKernelVariables(execute)).map(v => v.name)).toEqual([
      'a',
    ]);
    expect((await inspectKernelVariable(execute, 'a')).repr).toBe('1');
    expect(sent).toHaveLength(2);
  });

  it('refuse a language they have no snippet for', async () => {
    await expect(
      listKernelVariables(async () => ({ stdout: '' }), { language: 'R' })
    ).rejects.toThrow(/Python kernels/);
  });
});

describe('kernelVariableExtent and formatBytes', () => {
  it('say how big a variable is in its own terms', () => {
    const base = { name: 'v', type: 't', preview: '' };
    expect(
      kernelVariableExtent({ ...base, kind: 'dataframe', shape: [3, 2] })
    ).toBe('3 rows × 2 cols');
    expect(
      kernelVariableExtent({
        ...base,
        kind: 'ndarray',
        shape: [3, 4],
        dtype: 'int64',
      })
    ).toBe('3 × 4 · int64');
    expect(
      kernelVariableExtent({
        ...base,
        kind: 'series',
        shape: [5],
        dtype: 'float64',
      })
    ).toBe('5 rows · float64');
    expect(kernelVariableExtent({ ...base, kind: 'mapping', length: 1 })).toBe(
      '1 key'
    );
    expect(kernelVariableExtent({ ...base, kind: 'sequence', length: 4 })).toBe(
      '4 items'
    );
    expect(kernelVariableExtent({ ...base, kind: 'string', length: 7 })).toBe(
      '7 chars'
    );
    expect(kernelVariableExtent({ ...base, kind: 'scalar' })).toBe('');
    expect(formatBytes(28)).toBe('28 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(undefined)).toBe('');
  });
});
