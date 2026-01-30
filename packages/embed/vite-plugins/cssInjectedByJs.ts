/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Plugin } from 'vite';

/**
 * Vite plugin to inject CSS into the JavaScript bundle
 * This allows for a single-file distribution without separate CSS files
 */
export default function cssInjectedByJsPlugin(): Plugin {
  return {
    name: 'vite-plugin-css-injected-by-js',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const cssCode: string[] = [];

      // Collect all CSS code from bundle
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'asset' && fileName.endsWith('.css')) {
          cssCode.push(chunk.source as string);
          delete bundle[fileName]; // Remove CSS file from bundle
        }
      }

      // Inject CSS code into JavaScript chunks
      if (cssCode.length > 0) {
        const cssString = cssCode.join('\n');
        const cssInjectionCode = `
(function() {
  try {
    if (typeof document !== 'undefined') {
      var elementStyle = document.createElement('style');
      elementStyle.appendChild(document.createTextNode(${JSON.stringify(cssString)}));
      document.head.appendChild(elementStyle);
    }
  } catch(e) {
    console.error('vite-plugin-css-injected-by-js error:', e);
  }
})();
`;

        // Prepend CSS injection code to each JS chunk
        for (const fileName in bundle) {
          const chunk = bundle[fileName];
          if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
            chunk.code = cssInjectionCode + chunk.code;
          }
        }
      }
    },
  };
}
