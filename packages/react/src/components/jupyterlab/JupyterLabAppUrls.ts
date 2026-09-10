/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PageConfig } from '@jupyterlab/coreutils';

/**
 * Which URLs belong to JupyterLab, and therefore which ones an embedded
 * JupyterLab must not navigate the host page to.
 *
 * JupyterLab keeps the browser URL in step with its shell: it navigates on
 * `modeChanged`, on `currentPathChanged`, whenever the tree path is updated,
 * and when a route is not found. In JupyterLab that is the address bar
 * telling you where you are. Embedded in another application it is a rewrite
 * of *that* application's URL to a path it never routed — and an application
 * with a `/:handle` route will happily render `/lab` as somebody's profile.
 *
 * The rule is a pure function of the page configuration so it can be read
 * and tested without booting an application.
 */

/** The path prefixes JupyterLab considers its own, from `PageConfig`. */
export const jupyterLabUrlSpace = (): string[] =>
  Array.from(
    new Set(
      [
        PageConfig.getOption('appUrl') || '/lab',
        PageConfig.getOption('docUrl') || '/doc',
        // The defaults, kept whatever the configuration says: a deployment
        // that moves `appUrl` does not stop JupyterLab's own bundled
        // defaults appearing in a URL somebody built by hand.
        '/lab',
        '/doc',
      ]
        .map(url => String(url || '').trim())
        .filter(url => url.startsWith('/'))
        .map(url =>
          url.length > 1 && url.endsWith('/') ? url.slice(0, -1) : url
        )
    )
  );

/**
 * Whether a path is JupyterLab's to navigate to.
 *
 * The empty path is: it is what the `notFound` plugin uses to ask for the
 * base URL, which embedded is the host's own page.
 */
export const ownsJupyterLabPath = (
  path: unknown,
  space: string[] = jupyterLabUrlSpace()
): boolean => {
  if (typeof path !== 'string') {
    return true;
  }
  if (path === '') {
    return true;
  }
  if (path.startsWith('/api/jupyter-server/lab/')) {
    return true;
  }
  return space.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
};
