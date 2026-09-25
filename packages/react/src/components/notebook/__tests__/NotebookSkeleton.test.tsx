/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The notebook skeleton says one thing, once, in the shape of cells.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import {
  describe,
  expect,
  it,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('@datalayer/primer-addons', () => {
  const react = jest.requireActual('react') as typeof import('react');
  return {
    Box: react.forwardRef(({ sx: _sx, children, ...rest }: any, ref: any) =>
      react.createElement('div', { ...rest, ref }, children)
    ),
    // The ivory theme's text, on its light ground.
    useColorPalette: () => ({ textLight: '#1f1904', isLight: true }),
  };
});
jest.mock('@primer/react/experimental', () => {
  const react = jest.requireActual('react') as typeof import('react');
  return {
    SkeletonBox: (props: any) =>
      react.createElement('div', { 'data-skeleton': 'box', ...props }),
    SkeletonText: (props: any) =>
      react.createElement('div', {
        'data-skeleton': 'text',
        'data-lines': props.lines,
      }),
    SkeletonAvatar: (props: any) =>
      react.createElement('div', {
        'data-skeleton': 'avatar',
        'data-size': props.size,
      }),
  };
});

import { NotebookSkeleton } from '../NotebookSkeleton';

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

const show = (element: React.ReactNode) => {
  act(() => {
    root.render(element as any);
  });
};

const count = (kind: string) =>
  host.querySelectorAll(`[data-skeleton="${kind}"]`).length;

describe('the notebook skeleton', () => {
  it('is a single labelled status, its bars hidden from a reader', () => {
    show(<NotebookSkeleton />);
    const statuses = host.querySelectorAll('[role="status"]');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].getAttribute('aria-label')).toBe('Loading the notebook');
    expect(statuses[0].getAttribute('aria-busy')).toBe('true');
    const hidden = host.querySelector('[aria-hidden="true"]');
    for (const bar of Array.from(host.querySelectorAll('[data-skeleton]'))) {
      expect(hidden!.contains(bar)).toBe(true);
    }
  });

  it('is cells with gutters — four, two with output — and no header unless asked', () => {
    show(<NotebookSkeleton />);
    // A gutter and a source per cell, plus two outputs.
    expect(count('box')).toBe(4 * 2 + 2);
    expect(count('text')).toBe(0);
    expect(count('avatar')).toBe(0);

    show(<NotebookSkeleton header label="Loading the lesson" />);
    // The header's button, name and path, and two collaborators.
    expect(count('box')).toBe(4 * 2 + 2 + 1);
    expect(count('text')).toBe(2);
    expect(count('avatar')).toBe(2);
    expect(
      host.querySelector('[role="status"]')?.getAttribute('aria-label')
    ).toBe('Loading the lesson');
  });

  it('paints its bars in the user’s colours, not Primer’s grey', () => {
    show(<NotebookSkeleton />);
    const region = host.querySelector('[role="status"]') as HTMLElement;
    expect(region.style.getPropertyValue('--skeletonLoader-bgColor')).toBe(
      'rgba(31, 25, 4, 0.1)'
    );
  });

  it('draws the cells a host describes', () => {
    show(
      <NotebookSkeleton cells={[{ lines: 1 }, { lines: 2, output: true }]} />
    );
    expect(count('box')).toBe(2 * 2 + 1);
  });
});
