/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import * as libembed from './libembed';

let CDN_URL = 'https://cdn.jsdelivr.net/npm/';

let CDN_ONLY = true;

// find the data-cdn for any script tag, assuming it is only used for embed-amd.js
const scripts = document.getElementsByTagName('script');
Array.prototype.forEach.call(scripts, (script: HTMLScriptElement) => {
  CDN_URL = script.getAttribute('data-jupyter-widgets-cdn') || CDN_URL;
  CDN_ONLY =
    CDN_ONLY && Boolean(script.getAttribute('data-jupyter-widgets-cdn-only')!);
});

/**
 * Load a package using requirejs and return a promise
 *
 * @param pkg Package name or names to load
 */
const requirePromise = function (pkg: string | string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const require = (window as any).requirejs;
    if (require === undefined) {
      reject('Requirejs is needed, please ensure it is loaded on the page.');
    } else {
      require(pkg, resolve, reject);
    }
  });
};

function moduleNameToCDNUrl(moduleName: string, moduleVersion: string): string {
  let packageName = moduleName;
  let fileName = 'index'; // default filename
  // if a '/' is present, like 'foo/bar', packageName is changed to 'foo', and path to 'bar'
  // We first find the first '/'
  let index = moduleName.indexOf('/');
  if (index != -1 && moduleName[0] == '@') {
    // if we have a namespace, it's a different story
    // @foo/bar/baz should translate to @foo/bar and baz
    // so we find the 2nd '/'
    index = moduleName.indexOf('/', index + 1);
  }
  if (index != -1) {
    fileName = moduleName.substr(index + 1);
    packageName = moduleName.substr(0, index);
  }
  if (packageName === '@widgetti/jupyter-react') {
    // @widgetti/jupyter-react:0.4.2 is not published on https://www.jsdelivr.com/package/npm/@widgetti/jupyter-react
    moduleVersion = moduleVersion.replace('0.4.2', '0.4.1');
  }
  // jupyter-react@0.4.1
  return `${CDN_URL}${packageName}@${moduleVersion}/dist/${fileName}`;
}

/**
 * Load an amd module locally and fall back to specified CDN if unavailable.
 *
 * @param moduleName The name of the module to load..
 * @param version The semver range for the module, if loaded from a CDN.
 *
 * By default, the CDN service used is jsDelivr. However, this default can be
 * overridden by specifying another URL via the HTML attribute
 * "data-jupyter-widgets-cdn" on a script tag of the page.
 *
 * The semver range is only used with the CDN.
 */
export function requireLoader(
  moduleName: string,
  moduleVersion: string
): Promise<any> {
  const require = (window as any).requirejs;
  if (require === undefined) {
    throw new Error(
      'Requirejs is needed, please ensure it is loaded on the page.'
    );
  }
  function loadFromCDN(): Promise<any> {
    const conf: { paths: { [key: string]: string } } = { paths: {} };
    conf.paths[moduleName] = moduleNameToCDNUrl(moduleName, moduleVersion);
    require.config(conf);
    return requirePromise([`${moduleName}`]);
  }
  if (CDN_ONLY) {
    console.log(`Loading from ${CDN_URL} for ${moduleName}@${moduleVersion}`);
    return loadFromCDN();
  }
  return requirePromise([`${moduleName}`]).catch(err => {
    const failedId = err.requireModules && err.requireModules[0];
    if (failedId) {
      require.undef(failedId);
      console.log(
        `Falling back to ${CDN_URL} for ${moduleName}@${moduleVersion}`
      );
      return loadFromCDN();
    }
  });
}

/**
 * Render widgets in a given element.
 *
 * @param element (default document.documentElement) The element containing widget state and views.
 * @param loader (default requireLoader) The function used to look up the modules containing
 * the widgets' models and views classes. (The default loader looks them up on jsDelivr)
 */
export function renderWidgets(
  element = document.documentElement,
  loader: (
    moduleName: string,
    moduleVersion: string
  ) => Promise<any> = requireLoader
): void {
  requirePromise(['./classic/htmlmanager']).then(htmlmanager => {
    const managerFactory = (): any => {
      return new htmlmanager.HTMLManager({ loader: loader });
    };
    libembed.renderWidgets(managerFactory, element);
  });
}
