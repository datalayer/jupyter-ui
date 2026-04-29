/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Browser shim for Node's `url` module APIs used by transitive deps
 * (notably postcss map generator in Vite dev mode).
 *
 * We proxy legacy `url` APIs from the browser package (`url/`) so libraries
 * expecting `url.parse` keep working, and add modern helpers used by postcss.
 */

import * as legacyUrl from 'url/';

export const parse = legacyUrl.parse;
export const format = legacyUrl.format;
export const resolve = legacyUrl.resolve;
export const resolveObject = legacyUrl.resolveObject;
export const Url = (legacyUrl as any).Url;

export const pathToFileURL = (inputPath: string): URL => {
  const normalized = String(inputPath).replace(/\\/g, '/');
  const withLeadingSlash = normalized.startsWith('/')
    ? normalized
    : `/${normalized}`;
  return new URL(encodeURI(withLeadingSlash), 'file://');
};

export const fileURLToPath = (inputUrl: string | URL): string => {
  const url = typeof inputUrl === 'string' ? new URL(inputUrl) : inputUrl;
  if (url.protocol !== 'file:') {
    throw new TypeError(`Expected file URL, received: ${url.protocol}`);
  }
  return decodeURI(url.pathname);
};

const urlShim = {
  parse,
  format,
  resolve,
  resolveObject,
  Url,
  pathToFileURL,
  fileURLToPath,
};

export default urlShim;
