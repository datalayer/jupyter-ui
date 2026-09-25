/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The document skeleton says one thing, once, in the shape of prose.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('@datalayer/primer-addons', () => {
  const react = jest.requireActual('react');
  return {
    Box: react.forwardRef(({ sx: _sx, children, ...rest }: any, ref: any) =>
      react.createElement('div', { ...rest, ref }, children),
    ),
    useColorPalette: () => ({ textLight: '#1f1904', isLight: true }),
  };
});
jest.mock('@primer/react/experimental', () => {
  const react = jest.requireActual('react');
  return {
    SkeletonBox: (props: any) =>
      react.createElement('div', { 'data-skeleton': 'box', ...props }),
    SkeletonText: (props: any) =>
      react.createElement('div', {
        'data-skeleton': 'text',
        'data-lines': props.lines,
      }),
  };
});
/*
 * The header and the region come from the notebook package, which pulls
 * JupyterLab in at import time; what is under test here is the prose.
 */
jest.mock('@datalayer/jupyter-react', () => {
  const react = jest.requireActual('react');
  return {
    SkeletonRegion: ({ label, children }: any) =>
      react.createElement(
        'div',
        { role: 'status', 'aria-label': label, 'aria-busy': 'true' },
        react.createElement('div', { 'aria-hidden': 'true' }, children),
      ),
    EditorHeaderSkeleton: () =>
      react.createElement('div', { 'data-skeleton': 'header' }),
  };
});

import { DocumentSkeleton } from '../DocumentSkeleton';

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

describe('the document skeleton', () => {
  it('is a single labelled status, its bars hidden from a reader', () => {
    show(<DocumentSkeleton />);
    const statuses = host.querySelectorAll('[role="status"]');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].getAttribute('aria-label')).toBe('Loading the document');
    const hidden = host.querySelector('[aria-hidden="true"]');
    for (const bar of Array.from(host.querySelectorAll('[data-skeleton]'))) {
      expect(hidden!.contains(bar)).toBe(true);
    }
  });

  it('is prose — a title, uneven paragraphs and one figure — with no header unless asked', () => {
    show(<DocumentSkeleton />);
    expect(host.querySelectorAll('[data-skeleton="text"]')).toHaveLength(4);
    expect(host.querySelectorAll('[data-skeleton="box"]')).toHaveLength(1);
    expect(host.querySelector('[data-skeleton="header"]')).toBeNull();

    show(<DocumentSkeleton header label="Loading the lesson" />);
    expect(host.querySelector('[data-skeleton="header"]')).not.toBeNull();
    expect(
      host.querySelector('[role="status"]')?.getAttribute('aria-label'),
    ).toBe('Loading the lesson');
  });
});
