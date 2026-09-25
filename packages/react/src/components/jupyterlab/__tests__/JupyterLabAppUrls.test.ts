/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * An embedded JupyterLab does not own the page it is on.
 *
 * `application-extension:main` navigates the browser to `PageConfig.getUrl()`
 * whenever the shell mode or the tree path changes, and `notFound` navigates
 * to the base URL. In a host application those rewrites replace a URL that
 * host routed with one it did not — a product with a `/:handle` route renders
 * `/lab` as a profile for somebody called "lab". These are the paths the
 * router guard refuses.
 */

import { PageConfig } from '@jupyterlab/coreutils';
import { jupyterLabUrlSpace, ownsJupyterLabPath } from '../JupyterLabAppUrls';

describe('the JupyterLab URL space', () => {
  afterEach(() => {
    PageConfig.setOption('appUrl', '');
    PageConfig.setOption('docUrl', '');
  });

  it('holds the defaults when nothing is configured', () => {
    expect(jupyterLabUrlSpace()).toEqual(['/lab', '/doc']);
  });

  it('holds a configured app URL as well as the defaults', () => {
    PageConfig.setOption('appUrl', '/jupyter/lab/');
    // The trailing slash goes so `/jupyter/lab` itself is inside the space,
    // and the bundled defaults stay: a URL built by hand still says `/lab`.
    expect(jupyterLabUrlSpace()).toEqual(['/jupyter/lab', '/doc', '/lab']);
  });
});

describe('what an embedded JupyterLab may navigate to', () => {
  const space = ['/lab', '/doc'];

  it('refuses its own application URL and everything under it', () => {
    // `modeChanged` navigates here; this is the redirect that made a host
    // application render `/lab`.
    expect(ownsJupyterLabPath('/lab', space)).toBe(true);
    expect(ownsJupyterLabPath('/doc', space)).toBe(true);
    // The tree path and the workspaces, which the guard began with.
    expect(ownsJupyterLabPath('/lab/tree/notebook.ipynb', space)).toBe(true);
    expect(ownsJupyterLabPath('/lab/workspaces/auto-1', space)).toBe(true);
    expect(
      ownsJupyterLabPath('/api/jupyter-server/lab/workspaces/auto-1', space)
    ).toBe(true);
  });

  it('refuses the empty path the not-found route asks for', () => {
    // `router.navigate('')` means "back to the base URL", which embedded is
    // the host's own page.
    expect(ownsJupyterLabPath('', space)).toBe(true);
  });

  it('refuses anything that is not a path at all', () => {
    expect(ownsJupyterLabPath(undefined, space)).toBe(true);
    expect(ownsJupyterLabPath(null, space)).toBe(true);
  });

  it('leaves the host application its own URLs', () => {
    // A prefix match, not a substring one: these are the host's.
    expect(ownsJupyterLabPath('/', space)).toBe(false);
    expect(ownsJupyterLabPath('/runs/launch-1', space)).toBe(false);
    expect(ownsJupyterLabPath('/laboratory', space)).toBe(false);
    expect(ownsJupyterLabPath('/docs/evals', space)).toBe(false);
  });
});
