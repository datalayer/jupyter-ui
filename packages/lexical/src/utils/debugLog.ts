/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Console output that is only wanted while debugging.
 *
 * The plugins have a lot to say about what they insert, move and run; none
 * of it is for a page that works. With `?debug=true` in the address bar it is
 * all there; without, the console carries warnings and errors alone.
 *
 * @module utils/debugLog
 */

let enabled: boolean | undefined;

export function isDebugEnabled(): boolean {
  if (enabled === undefined) {
    enabled =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('debug') === 'true';
  }
  return enabled;
}

export function debugLog(...args: unknown[]): void {
  if (isDebugEnabled()) {
    // The one place a log is allowed: it is off unless asked for.
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}
