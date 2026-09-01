/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The configuration singleton, and the two jobs that were confused for one.
 *
 * `loadJupyterConfig` builds this configuration *and* repoints `PageConfig` at
 * the server named in the page. Only the second was ever a problem — a
 * component calling it during render moved every Jupyter connection on the
 * page — but removing the call that did it took the first with it. Nothing
 * else in this package builds the singleton, so four accessors began throwing
 * "Jupyter React Config must be loaded first" on every page that had stopped
 * calling it.
 *
 * These hold the split: the configuration gets built, and `PageConfig` is left
 * exactly as it was found.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PageConfig } from '@jupyterlab/coreutils';
import {
  ensureJupyterConfig,
  getJupyterServerUrl,
  resetJupyterConfig,
} from '../JupyterConfig';

describe('ensureJupyterConfig', () => {
  beforeEach(() => {
    resetJupyterConfig();
  });

  it('leaves a baseUrl somebody else set exactly alone', () => {
    // A JupyterLite kernel points the page at its own origin when it starts.
    // Anything that repoints it afterwards sends the next kernel connection
    // elsewhere, and the cells run into silence with no error to say why.
    PageConfig.setOption('baseUrl', 'https://lite.example.test/');
    ensureJupyterConfig();
    expect(PageConfig.getOption('baseUrl')).toBe('https://lite.example.test/');
  });

  it('adopts that baseUrl rather than deciding one of its own', () => {
    PageConfig.setOption('baseUrl', 'https://lite.example.test/');
    ensureJupyterConfig();
    expect(getJupyterServerUrl()).toBe('https://lite.example.test/');
  });

  it('makes the accessors usable, which is the whole point', () => {
    expect(() => getJupyterServerUrl()).toThrow(
      'Jupyter React Config must be loaded first.',
    );
    ensureJupyterConfig();
    expect(() => getJupyterServerUrl()).not.toThrow();
  });

  it('is idempotent', () => {
    expect(ensureJupyterConfig()).toBe(ensureJupyterConfig());
  });
});
