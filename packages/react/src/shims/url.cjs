/*
 * CommonJS shim for Node's `url` module APIs in browser builds.
 * Keeps legacy parse/format APIs and adds pathToFileURL/fileURLToPath.
 */

const legacyUrl = require('url/');

function pathToFileURL(inputPath) {
  const normalized = String(inputPath).replace(/\\/g, '/');
  const withLeadingSlash = normalized.startsWith('/')
    ? normalized
    : `/${normalized}`;
  return new URL(encodeURI(withLeadingSlash), 'file://');
}

function fileURLToPath(inputUrl) {
  const url = typeof inputUrl === 'string' ? new URL(inputUrl) : inputUrl;
  if (url.protocol !== 'file:') {
    throw new TypeError(`Expected file URL, received: ${url.protocol}`);
  }
  return decodeURI(url.pathname);
}

module.exports = {
  ...legacyUrl,
  pathToFileURL,
  fileURLToPath,
};
