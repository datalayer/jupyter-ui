/**
 * @jest-environment jsdom
 */

/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The colour mode a drawing is rendered in.
 *
 * Excalidraw has to be told light or dark — it rasterizes a scene rather than
 * reading CSS variables — and the old default was the literal `'light'`. A
 * host that themed everything else correctly still got a light drawing on a
 * dark document, and could only find out by looking at a picture. These tests
 * are that picture, in a form that fails a build.
 */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { ThemeContext, useTheme } from '../ThemeContext';

let container: HTMLDivElement;
let root: Root;
let seen: string | undefined;

/** Renders `useTheme` against `anchor` and records what it answered. */
function Probe({ anchor }: { anchor?: Element | null }) {
  seen = useTheme(anchor).theme;
  return null;
}

function render(node: React.ReactNode) {
  act(() => {
    root.render(node);
  });
}

beforeEach(() => {
  seen = undefined;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  // jsdom has no matchMedia; `auto` resolves through it.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
});

afterEach(async () => {
  // `await`: unmounting inside a synchronous `act` while React still has work
  // queued makes it warn. Nothing to do with what is under test — just the
  // tidy way to close a root.
  await act(async () => {
    root.unmount();
  });
  container.remove();
  document.body.querySelectorAll('[data-color-mode]').forEach(n => n.remove());
});

describe('useTheme', () => {
  it('takes an explicit provider over anything in the DOM', () => {
    const light = document.createElement('div');
    light.setAttribute('data-color-mode', 'light');
    document.body.appendChild(light);

    render(
      <ThemeContext.Provider value={{ theme: 'dark' }}>
        <Probe />
      </ThemeContext.Provider>,
    );

    // The host said dark. The DOM says light. The host wins.
    expect(seen).toBe('dark');
  });

  it('reads the page colour mode when no provider states one', () => {
    const dark = document.createElement('div');
    dark.setAttribute('data-color-mode', 'dark');
    document.body.appendChild(dark);

    render(<Probe />);

    // This is the case that used to answer 'light' regardless.
    expect(seen).toBe('dark');
  });

  it('answers for the nearest themed region, not the outermost', () => {
    const outer = document.createElement('div');
    outer.setAttribute('data-color-mode', 'light');
    const inner = document.createElement('div');
    inner.setAttribute('data-color-mode', 'dark');
    outer.appendChild(inner);
    const anchor = document.createElement('span');
    inner.appendChild(anchor);
    document.body.appendChild(outer);

    render(<Probe anchor={anchor} />);

    // A dark editor inside a light page: the drawing belongs to the editor.
    expect(seen).toBe('dark');
  });

  it('follows the mode when it is toggled', async () => {
    const region = document.createElement('div');
    region.setAttribute('data-color-mode', 'light');
    document.body.appendChild(region);

    render(<Probe anchor={region} />);
    expect(seen).toBe('light');

    // `await`, because a MutationObserver delivers on a microtask: without
    // flushing it the assertion below runs before the observer has been told
    // anything, which is a fact about the test rather than about the code.
    await act(async () => {
      region.setAttribute('data-color-mode', 'dark');
    });

    expect(seen).toBe('dark');
  });

  it('resolves "auto" against the system preference', () => {
    (window.matchMedia as unknown as jest.Mock) = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as never;

    const region = document.createElement('div');
    region.setAttribute('data-color-mode', 'auto');
    document.body.appendChild(region);

    render(<Probe anchor={region} />);

    expect(seen).toBe('dark');
  });

  it('falls back to light when the page says nothing at all', () => {
    render(<Probe />);
    expect(seen).toBe('light');
  });
});
