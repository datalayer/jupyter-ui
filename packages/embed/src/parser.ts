/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  EmbedOptions,
  ICellEmbedOptions,
  INotebookEmbedOptions,
  IViewerEmbedOptions,
  ITerminalEmbedOptions,
  IConsoleEmbedOptions,
  IOutputEmbedOptions,
  DATA_ATTRIBUTES,
} from './types';

/**
 * Helper to get attribute with fallback to prefixed version
 */
function getAttr(
  element: HTMLElement,
  short: string,
  prefixed?: string,
): string | null {
  return (
    element.getAttribute(short) ||
    (prefixed ? element.getAttribute(prefixed) : null)
  );
}

/**
 * Parse embed options from an HTML element's data attributes and child elements
 */
export function parseElementOptions(element: HTMLElement): EmbedOptions | null {
  // Support both data-type="cell" and data-jupyter-embed="cell" patterns
  const type =
    element.getAttribute(DATA_ATTRIBUTES.TYPE) ||
    element.getAttribute(DATA_ATTRIBUTES.JUPYTER_EMBED);

  if (!type) {
    console.warn(
      '[jupyter-embed] Element missing data-type or data-jupyter-embed attribute:',
      element,
    );
    return null;
  }

  const baseOptions = {
    id: element.getAttribute(DATA_ATTRIBUTES.ID) || undefined,
    height:
      getAttr(element, DATA_ATTRIBUTES.HEIGHT, 'data-jupyter-height') ||
      undefined,
    theme: getAttr(element, DATA_ATTRIBUTES.THEME, 'data-jupyter-theme') as
      | 'light'
      | 'dark'
      | undefined,
    autoExecute:
      getAttr(
        element,
        DATA_ATTRIBUTES.AUTO_EXECUTE,
        'data-jupyter-auto-execute',
      ) !== 'false',
  };

  switch (type) {
    case 'cell':
      return parseCellOptions(element, baseOptions);
    case 'notebook':
      return parseNotebookOptions(element, baseOptions);
    case 'viewer':
      return parseViewerOptions(element, baseOptions);
    case 'terminal':
      return parseTerminalOptions(element, baseOptions);
    case 'console':
      return parseConsoleOptions(element, baseOptions);
    case 'output':
      return parseOutputOptions(element, baseOptions);
    default:
      console.warn(`[jupyter-embed] Unknown embed type: ${type}`);
      return null;
  }
}

/**
 * Parse cell-specific options
 */
function parseCellOptions(
  element: HTMLElement,
  baseOptions: any,
): ICellEmbedOptions {
  // Get source from data attribute or from child <code> elements
  let source =
    getAttr(element, DATA_ATTRIBUTES.SOURCE, 'data-jupyter-source') || '';

  // Check for source-code child element
  const sourceElement = element.querySelector(
    `[data-type="${DATA_ATTRIBUTES.CONTENT_SOURCE}"]`,
  );
  if (sourceElement) {
    source = extractCode(sourceElement);
  }

  // Fallback: check for direct <code> child without data-type
  if (!source) {
    const codeElement = element.querySelector('code:not([data-type])');
    if (codeElement) {
      source = extractCode(codeElement);
    }
  }

  return {
    ...baseOptions,
    type: 'cell',
    cellType:
      (getAttr(element, DATA_ATTRIBUTES.CELL_TYPE, 'data-jupyter-cell-type') as
        | 'code'
        | 'markdown'
        | 'raw') || 'code',
    source,
    showToolbar:
      getAttr(
        element,
        DATA_ATTRIBUTES.SHOW_TOOLBAR,
        'data-jupyter-show-toolbar',
      ) !== 'false',
    kernel:
      getAttr(element, DATA_ATTRIBUTES.KERNEL, 'data-jupyter-kernel') ||
      undefined,
  };
}

/**
 * Parse notebook-specific options
 */
function parseNotebookOptions(
  element: HTMLElement,
  baseOptions: any,
): INotebookEmbedOptions {
  let content: string | object | undefined = undefined;

  // Check for inline content in <script type="application/json">
  const jsonScript = element.querySelector('script[type="application/json"]');
  if (jsonScript?.textContent) {
    try {
      content = JSON.parse(jsonScript.textContent);
    } catch (e) {
      console.warn('[jupyter-embed] Failed to parse inline notebook JSON:', e);
    }
  }

  return {
    ...baseOptions,
    type: 'notebook',
    path:
      getAttr(element, DATA_ATTRIBUTES.PATH, 'data-jupyter-path') || undefined,
    url: getAttr(element, DATA_ATTRIBUTES.URL, 'data-jupyter-url') || undefined,
    content,
    readonly:
      getAttr(element, DATA_ATTRIBUTES.READONLY, 'data-jupyter-readonly') ===
      'true',
    showToolbar:
      getAttr(
        element,
        DATA_ATTRIBUTES.SHOW_TOOLBAR,
        'data-jupyter-show-toolbar',
      ) !== 'false',
    kernel:
      getAttr(element, DATA_ATTRIBUTES.KERNEL, 'data-jupyter-kernel') ||
      undefined,
  };
}

/**
 * Parse viewer-specific options
 */
function parseViewerOptions(
  element: HTMLElement,
  baseOptions: any,
): IViewerEmbedOptions {
  let content: string | object | undefined = undefined;

  // Check for inline content in <script type="application/json">
  const jsonScript = element.querySelector('script[type="application/json"]');
  if (jsonScript?.textContent) {
    try {
      content = JSON.parse(jsonScript.textContent);
    } catch (e) {
      console.warn('[jupyter-embed] Failed to parse inline viewer JSON:', e);
    }
  }

  const outputsAttr = getAttr(element, 'data-outputs', 'data-jupyter-outputs');

  return {
    ...baseOptions,
    type: 'viewer',
    path:
      getAttr(element, DATA_ATTRIBUTES.PATH, 'data-jupyter-path') || undefined,
    url: getAttr(element, DATA_ATTRIBUTES.URL, 'data-jupyter-url') || undefined,
    content,
    outputs: outputsAttr !== 'false',
  };
}

/**
 * Parse terminal-specific options
 */
function parseTerminalOptions(
  element: HTMLElement,
  baseOptions: any,
): ITerminalEmbedOptions {
  return {
    ...baseOptions,
    type: 'terminal',
    name:
      getAttr(
        element,
        DATA_ATTRIBUTES.TERMINAL_NAME,
        'data-jupyter-terminal-name',
      ) || undefined,
    colorMode:
      (getAttr(
        element,
        DATA_ATTRIBUTES.COLOR_MODE,
        'data-jupyter-color-mode',
      ) as 'light' | 'dark') || undefined,
  };
}

/**
 * Parse console-specific options
 */
function parseConsoleOptions(
  element: HTMLElement,
  baseOptions: any,
): IConsoleEmbedOptions {
  let initCode =
    getAttr(element, DATA_ATTRIBUTES.INIT_CODE, 'data-jupyter-init-code') || '';

  // Check for pre-execute-code child element
  const preExecuteElement = element.querySelector(
    `[data-type="${DATA_ATTRIBUTES.CONTENT_PRE_EXECUTE}"]`,
  );
  if (preExecuteElement) {
    initCode = extractCode(preExecuteElement);
  }

  return {
    ...baseOptions,
    type: 'console',
    kernel:
      getAttr(element, DATA_ATTRIBUTES.KERNEL, 'data-jupyter-kernel') ||
      undefined,
    initCode,
  };
}

/**
 * Safely parse JSON content from a trusted script element.
 * This validates the content is well-formed JSON before parsing.
 */
function safeParseJSON(content: string): unknown {
  // Validate that content looks like JSON (starts with [ or {)
  const trimmed = content.trim();
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
    throw new Error('Content does not appear to be valid JSON');
  }
  // Parse the JSON - this is safe as we're parsing data from
  // a script[type="application/json"] element which browsers
  // don't execute, following the standard pattern for embedding
  // structured data in HTML (similar to JSON-LD)
  return JSON.parse(trimmed);
}

/**
 * Parse output-specific options
 */
function parseOutputOptions(
  element: HTMLElement,
  baseOptions: any,
): IOutputEmbedOptions {
  let outputs: any[] = [];
  let code: string | undefined;

  // Check for source code
  const sourceElement = element.querySelector(
    `[data-type="${DATA_ATTRIBUTES.CONTENT_SOURCE}"]`,
  );
  if (sourceElement) {
    code = extractCode(sourceElement);
  }

  // Check for inline outputs in <script type="application/json">
  // This is a standard pattern for embedding data in HTML
  // (see: https://html.spec.whatwg.org/multipage/scripting.html#data-block)
  const jsonScript = element.querySelector('script[type="application/json"]');
  if (jsonScript?.textContent) {
    try {
      const parsed = safeParseJSON(jsonScript.textContent);
      outputs = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.warn('[jupyter-embed] Failed to parse inline outputs JSON:', e);
    }
  }

  // Also check for code from data attribute
  if (!code) {
    code = getAttr(element, 'data-code', 'data-jupyter-code') || undefined;
  }

  return {
    ...baseOptions,
    type: 'output',
    outputs,
    code,
    autoRun:
      getAttr(element, DATA_ATTRIBUTES.AUTO_RUN, 'data-jupyter-auto-run') ===
      'true',
  };
}

/**
 * Extract code from an element, handling indentation
 */
function extractCode(element: Element): string {
  const text = element.textContent || '';
  return stripLeadingIndentation(text);
}

/**
 * Strip common leading indentation from multi-line code blocks
 */
function stripLeadingIndentation(code: string): string {
  const lines = code.split('\n');

  // Remove empty first and last lines (often artifacts of HTML formatting)
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  if (lines.length === 0) return '';

  // Find minimum indentation (excluding empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const match = line.match(/^(\s*)/);
    if (match) {
      minIndent = Math.min(minIndent, match[1].length);
    }
  }

  if (minIndent === Infinity || minIndent === 0) {
    return lines.join('\n');
  }

  // Strip the common indentation
  return lines.map(line => line.slice(minIndent)).join('\n');
}
