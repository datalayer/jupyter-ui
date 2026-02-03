/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { build } from 'vite';
import type { OutputAsset, OutputBundle, OutputChunk, ModuleFormat } from 'rollup';
import type { BuildOptions, ResolvedConfig, Plugin, UserConfig, ConfigEnv } from 'vite';

interface InjectCodeOptions {
  styleId?: string | (() => string);
  useStrictCSP?: boolean;
  attributes?: { [key: string]: string } | undefined;
}

export type InjectCode = (cssCode: string, options: InjectCodeOptions) => string;
export type InjectCodeFunction = (cssCode: string, options: InjectCodeOptions) => void;

export interface DevOptions {
  enableDev?: boolean;
  removeStyleCode?: (id: string) => string;
  removeStyleCodeFunction?: (id: string) => void;
}

export interface BaseOptions {
  dev?: DevOptions;
  injectCode?: InjectCode;
  injectCodeFunction?: InjectCodeFunction;
  injectionCodeFormat?: ModuleFormat;
  styleId?: string | (() => string);
  topExecutionPriority?: boolean;
  useStrictCSP?: boolean;
}

export interface PluginConfiguration extends BaseOptions {
  cssAssetsFilterFunction?: (chunk: OutputAsset) => boolean;
  jsAssetsFilterFunction?: (chunk: OutputChunk) => boolean;
  preRenderCSSCode?: (cssCode: string) => string;
  relativeCSSInjection?: boolean;
  suppressUnusedCssWarning?: boolean;
}

interface CSSInjectionConfiguration extends BaseOptions {
  cssToInject: string;
}

interface BuildCSSInjectionConfiguration extends CSSInjectionConfiguration {
  buildOptions: BuildOptions;
}

const cssInjectedByJsId = '\0vite/all-css';

const defaultInjectCode: InjectCode = (cssCode, { styleId, useStrictCSP, attributes }) => {
  let attributesInjection = '';

  for (const attribute in attributes) {
    attributesInjection += `elementStyle.setAttribute('${attribute}', '${attributes[attribute]}');`;
  }

  return `try{if(typeof document != 'undefined'){var elementStyle = document.createElement('style');${
    typeof styleId == 'string' && styleId.length > 0 ? `elementStyle.id = '${styleId}';` : ''
  }${
    useStrictCSP
      ? `elementStyle.nonce = document.head.querySelector('meta[property=csp-nonce]')?.content;`
      : ''
  }${attributesInjection}elementStyle.appendChild(document.createTextNode(${cssCode}));document.head.appendChild(elementStyle);}}catch(e){console.error('vite-plugin-css-injected-by-js', e);}`;
};

async function buildCSSInjectionCode({
  buildOptions,
  cssToInject,
  injectCode,
  injectCodeFunction,
  injectionCodeFormat = 'iife',
  styleId,
  useStrictCSP,
}: BuildCSSInjectionConfiguration): Promise<OutputChunk | null> {
  const { minify, target } = buildOptions;

  const generatedStyleId = typeof styleId === 'function' ? styleId() : styleId;

  const res = await build({
    root: '',
    configFile: false,
    logLevel: 'error',
    plugins: [
      injectionCSSCodePlugin({
        cssToInject,
        styleId: generatedStyleId,
        injectCode,
        injectCodeFunction,
        useStrictCSP,
      }),
    ],
    build: {
      write: false,
      target,
      minify,
      assetsDir: '',
      rollupOptions: {
        input: {
          ['all-css']: cssInjectedByJsId,
        },
        output: {
          format: injectionCodeFormat,
          manualChunks: undefined,
        },
      },
    },
  });
  const cssChunk = Array.isArray(res) ? res[0] : res;
  if (!('output' in cssChunk)) return null;

  return cssChunk.output[0] as OutputChunk;
}

function resolveInjectionCode(
  cssCode: string,
  injectCode: ((cssCode: string, options: InjectCodeOptions) => string) | undefined,
  injectCodeFunction: ((cssCode: string, options: InjectCodeOptions) => void) | undefined,
  { styleId, useStrictCSP, attributes }: InjectCodeOptions
) {
  const injectionOptions = { styleId, useStrictCSP, attributes };
  if (injectCodeFunction) {
    return `(${injectCodeFunction})(${cssCode}, ${JSON.stringify(injectionOptions)})`;
  }
  const injectFunction = injectCode || defaultInjectCode;
  return injectFunction(cssCode, injectionOptions);
}

function injectionCSSCodePlugin({
  cssToInject,
  injectCode,
  injectCodeFunction,
  styleId,
  useStrictCSP,
}: CSSInjectionConfiguration): Plugin {
  return {
    name: 'vite:injection-css-code-plugin',
    resolveId(id: string) {
      if (id == cssInjectedByJsId) {
        return id;
      }
      return null;
    },
    load(id: string) {
      if (id == cssInjectedByJsId) {
        const cssCode = JSON.stringify(cssToInject.trim());
        return resolveInjectionCode(cssCode, injectCode, injectCodeFunction, { styleId, useStrictCSP });
      }
      return null;
    },
  };
}

function removeLinkStyleSheets(html: string, cssFileName: string): string {
  const removeCSS = new RegExp(`<link rel=".*"[^>]*?href=".*/?${cssFileName}"[^>]*?>`);
  return html.replace(removeCSS, '');
}

function warnLog(msg: string) {
  console.warn(`\x1b[33m \n${msg} \x1b[39m`);
}

function debugLog(msg: string) {
  console.debug(`\x1b[34m \n${msg} \x1b[39m`);
}

function isJsOutputChunk(chunk: OutputAsset | OutputChunk): chunk is OutputChunk {
  return chunk.type == 'chunk' && chunk.fileName.match(/.[cm]?js(?:\?.+)?$/) != null;
}

function defaultJsAssetsFilter(chunk: OutputChunk): boolean {
  return chunk.isEntry && !chunk.fileName.includes('polyfill');
}

const cssSourceCache: { [key: string]: string } = {};

function extractCss(bundle: OutputBundle, cssName: string): string {
  const cssAsset = bundle[cssName] as OutputAsset;

  if (cssAsset !== undefined && cssAsset.source) {
    const cssSource = cssAsset.source;
    cssSourceCache[cssName] =
      cssSource instanceof Uint8Array ? new TextDecoder().decode(cssSource) : `${cssSource}`;
  }

  return cssSourceCache[cssName] ?? '';
}

function concatCssAndDeleteFromBundle(bundle: OutputBundle, cssAssets: string[]): string {
  return cssAssets.reduce(function extractCssAndDeleteFromBundle(previous: string, cssName: string): string {
    const cssSource = extractCss(bundle, cssName);
    delete bundle[cssName];

    return previous + cssSource;
  }, '');
}

function buildJsCssMap(
  bundle: OutputBundle,
  jsAssetsFilterFunction?: PluginConfiguration['jsAssetsFilterFunction']
): Record<string, string[]> {
  const chunksWithCss: Record<string, string[]> = {};

  const bundleKeys = getJsTargetBundleKeys(
    bundle,
    typeof jsAssetsFilterFunction == 'function' ? jsAssetsFilterFunction : () => true
  );
  if (bundleKeys.length === 0) {
    throw new Error(
      'Unable to locate the JavaScript asset for adding the CSS injection code. It is recommended to review your configurations.'
    );
  }

  for (const key of bundleKeys) {
    const chunk = bundle[key];
    if (chunk.type === 'asset' || !chunk.viteMetadata || chunk.viteMetadata.importedCss.size === 0) {
      continue;
    }

    const chunkStyles = chunksWithCss[key] || [];
    chunkStyles.push(...chunk.viteMetadata.importedCss.values());
    chunksWithCss[key] = chunkStyles;
  }

  return chunksWithCss;
}

function getJsTargetBundleKeys(
  bundle: OutputBundle,
  jsAssetsFilterFunction?: PluginConfiguration['jsAssetsFilterFunction']
): string[] {
  if (typeof jsAssetsFilterFunction != 'function') {
    const jsAssets = Object.keys(bundle).filter((i) => {
      const asset = bundle[i];
      return isJsOutputChunk(asset) && defaultJsAssetsFilter(asset);
    });

    if (jsAssets.length == 0) {
      return [];
    }

    const jsTargetFileName = jsAssets[jsAssets.length - 1];
    if (jsAssets.length > 1) {
      warnLog(
        `[vite-plugin-css-injected-by-js] has identified "${jsTargetFileName}" as one of the multiple output files marked as "entry" to put the CSS injection code.` +
          'However, if this is not the intended file to add the CSS injection code, you can use the "jsAssetsFilterFunction" parameter to specify the desired output file (read docs).'
      );
      if (process.env.VITE_CSS_INJECTED_BY_JS_DEBUG) {
        const jsAssetsStr = jsAssets.join(', ');
        debugLog(
          `[vite-plugin-css-injected-by-js] identified js file targets: ${jsAssetsStr}. Selected "${jsTargetFileName}".\n`
        );
      }
    }

    return [jsTargetFileName];
  }

  const chunkFilter = ([_key, chunk]: [string, OutputAsset | OutputChunk]) =>
    isJsOutputChunk(chunk) && jsAssetsFilterFunction(chunk);

  return Object.entries(bundle)
    .filter(chunkFilter)
    .map(function extractAssetKeyFromBundleEntry([key]) {
      return key;
    });
}

async function relativeCssInjection(
  bundle: OutputBundle,
  assetsWithCss: Record<string, string[]>,
  buildCssCode: (css: string) => Promise<OutputChunk | null>,
  topExecutionPriorityFlag: boolean
): Promise<void> {
  for (const [jsAssetName, cssAssets] of Object.entries(assetsWithCss)) {
    process.env.VITE_CSS_INJECTED_BY_JS_DEBUG &&
      debugLog(`[vite-plugin-css-injected-by-js] Relative CSS: ${jsAssetName}: [ ${cssAssets.join(',')} ]`);
    const assetCss = concatCssAndDeleteFromBundle(bundle, cssAssets);
    const cssInjectionCode = assetCss.length > 0 ? (await buildCssCode(assetCss))?.code : '';

    const jsAsset = bundle[jsAssetName] as OutputChunk;
    jsAsset.code = buildOutputChunkWithCssInjectionCode(
      jsAsset.code,
      cssInjectionCode ?? '',
      topExecutionPriorityFlag
    );
  }
}

const globalCSSCodeEntryCache = new Map<string, string>();
let previousFacadeModuleId = '';

async function globalCssInjection(
  bundle: OutputBundle,
  cssAssets: string[],
  buildCssCode: (css: string) => Promise<OutputChunk | null>,
  jsAssetsFilterFunction: PluginConfiguration['jsAssetsFilterFunction'],
  topExecutionPriorityFlag: boolean
) {
  const jsTargetBundleKeys = getJsTargetBundleKeys(bundle, jsAssetsFilterFunction);
  if (jsTargetBundleKeys.length == 0) {
    throw new Error(
      'Unable to locate the JavaScript asset for adding the CSS injection code. It is recommended to review your configurations.'
    );
  }

  process.env.VITE_CSS_INJECTED_BY_JS_DEBUG &&
    debugLog(`[vite-plugin-css-injected-by-js] Global CSS Assets: [${cssAssets.join(',')}]`);
  const allCssCode = concatCssAndDeleteFromBundle(bundle, cssAssets);
  let cssInjectionCode: string = '';

  if (allCssCode.length > 0) {
    const cssCode = (await buildCssCode(allCssCode))?.code;
    if (typeof cssCode == 'string') {
      cssInjectionCode = cssCode;
    }
  }

  for (const jsTargetKey of jsTargetBundleKeys) {
    const jsAsset = bundle[jsTargetKey] as OutputChunk;

    if (jsAsset.facadeModuleId != null && jsAsset.isEntry && cssInjectionCode != '') {
      if (jsAsset.facadeModuleId != previousFacadeModuleId) {
        globalCSSCodeEntryCache.clear();
      }
      previousFacadeModuleId = jsAsset.facadeModuleId;
      globalCSSCodeEntryCache.set(jsAsset.facadeModuleId, cssInjectionCode);
    }
    if (
      cssInjectionCode == '' &&
      jsAsset.isEntry &&
      jsAsset.facadeModuleId != null &&
      typeof globalCSSCodeEntryCache.get(jsAsset.facadeModuleId) == 'string'
    ) {
      cssInjectionCode = globalCSSCodeEntryCache.get(jsAsset.facadeModuleId) as string;
    }

    process.env.VITE_CSS_INJECTED_BY_JS_DEBUG &&
      debugLog(`[vite-plugin-css-injected-by-js] Global CSS inject: ${jsAsset.fileName}`);
    jsAsset.code = buildOutputChunkWithCssInjectionCode(
      jsAsset.code,
      cssInjectionCode ?? '',
      topExecutionPriorityFlag
    );
  }
}

function buildOutputChunkWithCssInjectionCode(
  jsAssetCode: string,
  cssInjectionCode: string,
  topExecutionPriorityFlag: boolean
): string {
  const appCode = jsAssetCode.replace(/\/\*\s*empty css\s*\*\//g, '');
  let output = topExecutionPriorityFlag ? '' : appCode;
  output += cssInjectionCode;
  output += !topExecutionPriorityFlag ? '' : appCode;

  return output;
}

function clearImportedCssViteMetadataFromBundle(bundle: OutputBundle, unusedCssAssets: string[]): void {
  for (const key in bundle) {
    const chunk = bundle[key] as OutputChunk;
    if (chunk.viteMetadata && chunk.viteMetadata.importedCss.size > 0) {
      const importedCssFileNames = chunk.viteMetadata.importedCss;
      importedCssFileNames.forEach((importedCssFileName) => {
        if (!unusedCssAssets.includes(importedCssFileName) && chunk.viteMetadata) {
          chunk.viteMetadata.importedCss = new Set();
        }
      });
    }
  }
}

function isCSSRequest(request: string): boolean {
  const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;

  return CSS_LANGS_RE.test(request);
}

export default function cssInjectedByJsPlugin({
  cssAssetsFilterFunction,
  dev: { enableDev, removeStyleCode, removeStyleCodeFunction } = {} as DevOptions,
  injectCode,
  injectCodeFunction,
  injectionCodeFormat,
  jsAssetsFilterFunction,
  preRenderCSSCode,
  relativeCSSInjection,
  styleId,
  suppressUnusedCssWarning,
  topExecutionPriority,
  useStrictCSP,
}: PluginConfiguration | undefined = {}): Plugin[] {
  let config: ResolvedConfig;

  const topExecutionPriorityFlag = typeof topExecutionPriority == 'boolean' ? topExecutionPriority : true;

  const plugins: Plugin[] = [
    {
      apply: 'build',
      enforce: 'post',
      name: 'vite-plugin-css-injected-by-js',
      config(config: UserConfig, env: ConfigEnv) {
        if (env.command === 'build') {
          if (!config.build) {
            config.build = {};
          }

          if (relativeCSSInjection == true) {
            if (!config.build.cssCodeSplit) {
              config.build.cssCodeSplit = true;
              warnLog(
                `[vite-plugin-css-injected-by-js] Override of 'build.cssCodeSplit' option to true, it must be true when 'relativeCSSInjection' is enabled.`
              );
            }
          }
        }
      },
      configResolved(_config: ResolvedConfig) {
        config = _config;
      },
      async generateBundle(opts, bundle) {
        if (config.build.ssr) {
          return;
        }

        const buildCssCode = (cssToInject: string) =>
          buildCSSInjectionCode({
            buildOptions: config.build,
            cssToInject:
              typeof preRenderCSSCode == 'function' ? preRenderCSSCode(cssToInject) : cssToInject,
            injectCode,
            injectCodeFunction,
            injectionCodeFormat,
            styleId,
            useStrictCSP,
          });

        const cssAssetsFilter = (asset: OutputAsset): boolean => {
          return typeof cssAssetsFilterFunction == 'function' ? cssAssetsFilterFunction(asset) : true;
        };

        const cssAssets = Object.keys(bundle).filter(
          (i) =>
            bundle[i].type == 'asset' &&
            bundle[i].fileName.endsWith('.css') &&
            cssAssetsFilter(bundle[i] as OutputAsset)
        );

        let unusedCssAssets: string[] = [];
        if (relativeCSSInjection) {
          const assetsWithCss = buildJsCssMap(bundle, jsAssetsFilterFunction);
          await relativeCssInjection(bundle, assetsWithCss, buildCssCode, topExecutionPriorityFlag);

          unusedCssAssets = cssAssets.filter((cssAsset) => !!bundle[cssAsset]);
          if (!suppressUnusedCssWarning) {
            const unusedCssAssetsString = unusedCssAssets.join(',');
            unusedCssAssetsString.length > 0 &&
              warnLog(
                `[vite-plugin-css-injected-by-js] Some CSS assets were not included in any known JS: ${unusedCssAssetsString}`
              );
          }
        } else {
          const allCssAssets = Object.keys(bundle).filter(
            (i) => bundle[i].type == 'asset' && bundle[i].fileName.endsWith('.css')
          );

          unusedCssAssets = allCssAssets.filter((cssAsset) => !cssAssets.includes(cssAsset));

          await globalCssInjection(bundle, cssAssets, buildCssCode, jsAssetsFilterFunction, topExecutionPriorityFlag);
        }

        clearImportedCssViteMetadataFromBundle(bundle, unusedCssAssets);

        const htmlFiles = Object.keys(bundle).filter((i) => i.endsWith('.html'));
        for (const name of htmlFiles) {
          const htmlChunk = bundle[name] as OutputAsset;
          let replacedHtml =
            htmlChunk.source instanceof Uint8Array
              ? new TextDecoder().decode(htmlChunk.source)
              : `${htmlChunk.source}`;

          cssAssets.forEach(function replaceLinkedStylesheetsHtml(cssName) {
            if (!unusedCssAssets.includes(cssName)) {
              replacedHtml = removeLinkStyleSheets(replacedHtml, cssName);
              htmlChunk.source = replacedHtml;
            }
          });
        }
      },
    },
  ];

  if (enableDev) {
    warnLog('[vite-plugin-css-injected-by-js] Experimental dev mode activated! Please, for any error open a issue.');

    plugins.push({
      name: 'vite-plugin-css-injected-by-js-dev',
      apply: 'serve',
      enforce: 'post',
      transform(src, id) {
        if (isCSSRequest(id)) {
          const defaultRemoveStyleCode = (devId: string) => `{
                        (function removeStyleInjected() {
                            const elementsToRemove = document.querySelectorAll("style[data-vite-dev-id='${devId}']");
                            elementsToRemove.forEach(element => {
                                element.remove();
                            });
                        })()
                    }`;

          let removeStyleFunction: (id: string) => string = removeStyleCode || defaultRemoveStyleCode;
          if (removeStyleCodeFunction) {
            removeStyleFunction = (id) => `(${removeStyleCodeFunction})("${id}")`;
          }

          let injectionCode = src.replace(
            '__vite__updateStyle(__vite__id, __vite__css)',
            ';\n' +
              removeStyleFunction(id) +
              ';\n' +
              resolveInjectionCode('__vite__css', injectCode, injectCodeFunction, {
                attributes: { type: 'text/css', ['data-vite-dev-id']: id },
              })
          );

          injectionCode = injectionCode.replace('__vite__removeStyle(__vite__id)', removeStyleFunction(id));

          return {
            code: injectionCode,
            map: null,
          };
        }
        return null;
      },
    });
  }

  return plugins;
}
