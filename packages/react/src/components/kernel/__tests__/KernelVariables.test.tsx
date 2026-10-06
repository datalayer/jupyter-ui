/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The variables view says what it can: no kernel, a kernel starting, a
 * kernel of another language, no variables, and the variables, each opened
 * by a click and drawn by its renderer.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('@datalayer/primer-addons', () => {
  const react = jest.requireActual('react') as typeof import('react');
  return {
    Box: react.forwardRef(({ sx: _sx, as, children, ...rest }: any, ref: any) =>
      react.createElement(as ?? 'div', { ...rest, ref }, children)
    ),
  };
});
jest.mock('@primer/react', () => {
  const react = jest.requireActual('react') as typeof import('react');
  const plain =
    (tag: string) =>
    ({
      sx: _sx,
      as,
      children,
      leadingVisual: _l,
      variant: _v,
      size: _s,
      ...rest
    }: any) =>
      react.createElement(as ?? tag, rest, children);
  return {
    Flash: plain('div'),
    Label: plain('span'),
    Text: plain('span'),
    Spinner: () => react.createElement('span', { 'data-spinner': '' }),
    IconButton: ({ icon: _i, sx: _sx, ...rest }: any) =>
      react.createElement('button', rest),
    TextInput: ({ leadingVisual: _l, sx: _sx, size: _s, ...rest }: any) =>
      react.createElement('input', rest),
    ToggleSwitch: ({ checked, onClick }: any) =>
      react.createElement('button', {
        'aria-pressed': checked,
        onClick,
        'data-toggle': '',
      }),
  };
});

import { KernelVariables } from '../KernelVariables';
import { KERNEL_VARIABLES_MARKER } from '../variables/introspection';

const printed = (payload: unknown) => ({
  stdout: `${KERNEL_VARIABLES_MARKER}${JSON.stringify(payload)}${KERNEL_VARIABLES_MARKER}`,
});

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const flush = async () => {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
};
const state = () =>
  host
    .querySelector('[data-kernel-variables]')
    ?.getAttribute('data-kernel-variables');

describe('KernelVariables', () => {
  it('says there is no kernel', async () => {
    act(() => root.render(<KernelVariables />));
    await flush();
    expect(state()).toBe('none');
  });

  it('says the kernel is starting until it is ready', async () => {
    const kernel = {
      ready: new Promise<void>(() => {}),
      connection: null,
    } as any;
    act(() => root.render(<KernelVariables kernel={kernel} />));
    await flush();
    expect(state()).toBe('starting');
    expect(host.textContent).toContain('starting');
  });

  it('says variables are listed for Python kernels only', async () => {
    const connection = {
      info: Promise.resolve({ language_info: { name: 'R' } }),
    } as any;
    act(() => root.render(<KernelVariables connection={connection} />));
    await flush();
    expect(state()).toBe('unsupported');
    expect(host.textContent).toContain('Python kernels');
    expect(host.textContent).toContain('R');
  });

  it('says when there are no variables yet', async () => {
    const execute = jest.fn(async () => printed({ variables: [] }));
    act(() => root.render(<KernelVariables execute={execute} />));
    await flush();
    expect(
      host.querySelector('[data-kernel-variables="empty"]')
    ).not.toBeNull();
  });

  it('lists the variables, filters them, and opens one with its renderer', async () => {
    const execute = jest.fn(async (code: string) =>
      code.includes('"df"')
        ? printed({
            variable: {
              name: 'df',
              type: 'DataFrame',
              kind: 'dataframe',
              preview: 'columns: x',
              shape: [1, 1],
              repr: '   x\n0  1',
              data: {
                columns: ['x'],
                dtypes: ['int64'],
                index: ['0'],
                rows: [['1']],
              },
            },
          })
        : printed({
            variables: [
              {
                name: 'a',
                type: 'int',
                kind: 'scalar',
                preview: '1',
                size: 28,
              },
              {
                name: 'df',
                type: 'DataFrame',
                kind: 'dataframe',
                preview: 'columns: x',
                shape: [1, 1],
              },
            ],
          })
    );
    act(() => root.render(<KernelVariables execute={execute} />));
    await flush();
    expect(state()).toBe('ready');
    const names = () =>
      Array.from(host.querySelectorAll('[data-kernel-variable]')).map(e =>
        e.getAttribute('data-kernel-variable')
      );
    expect(names()).toEqual(['a', 'df']);
    expect(host.textContent).toContain('1 rows × 1 cols');

    const input = host.querySelector('input')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!;
      setter.call(input, 'data');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(names()).toEqual(['df']);

    act(() =>
      (
        host.querySelector(
          '[data-kernel-variable="df"] > button'
        ) as HTMLButtonElement
      ).click()
    );
    await flush();
    const details = host.querySelector('[data-kernel-variable-details="df"]');
    expect(details?.getAttribute('data-renderer')).toBe('dataframe');
    expect(
      details?.querySelector('[data-kernel-variable-table]')
    ).not.toBeNull();
    expect(details?.textContent).toContain('x · int64');
  });

  it('lists again on refresh', async () => {
    const execute = jest.fn(async () => printed({ variables: [] }));
    act(() => root.render(<KernelVariables execute={execute} />));
    await flush();
    const calls = execute.mock.calls.length;
    act(() =>
      (
        host.querySelector(
          '[data-kernel-variables-refresh]'
        ) as HTMLButtonElement
      ).click()
    );
    await flush();
    expect(execute.mock.calls.length).toBe(calls + 1);
  });

  it('shows the error the kernel raised', async () => {
    const execute = jest.fn(async () => ({
      stdout: '',
      error: 'NameError: boom',
    }));
    act(() => root.render(<KernelVariables execute={execute} />));
    await flush();
    expect(host.textContent).toContain('NameError: boom');
  });
});
