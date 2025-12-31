/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Bootstrap loader for Jupyter Embed
 *
 * This is a lightweight entry point (~50KB) that:
 * 1. Scans the DOM for data-jupyter-embed elements
 * 2. Detects which component types are needed
 * 3. Dynamically loads only required chunks
 * 4. Initializes components
 */

// Inline minimal CSS for loading state
const LOADING_CSS = `
.jupyter-embed-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #59595c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
}
.jupyter-embed-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e9f7f1;
  border-top-color: #1abc9c;
  border-radius: 50%;
  animation: jupyter-embed-spin 0.8s linear infinite;
  margin-bottom: 8px;
}
@keyframes jupyter-embed-spin {
  to { transform: rotate(360deg); }
}
.jupyter-embed-error {
  color: #c0392b;
  background: #fdf2f2;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #c0392b;
}
`;

// Configuration interface
export interface IJupyterEmbedBootstrapConfig {
  serverUrl: string;
  token: string;
  cdnBase?: string;
  autoStartKernel?: boolean;
  defaultKernel?: string;
}

// Component type mapping
type ComponentType =
  | 'cell'
  | 'notebook'
  | 'terminal'
  | 'console'
  | 'output'
  | 'viewer';

// Global state
let config: IJupyterEmbedBootstrapConfig | null = null;
const loadedChunks: Set<string> = new Set();
let coreModule: any = null;

/**
 * Inject loading CSS into document
 */
function injectLoadingStyles(): void {
  if (document.getElementById('jupyter-embed-loading-styles')) return;

  const style = document.createElement('style');
  style.id = 'jupyter-embed-loading-styles';
  style.textContent = LOADING_CSS;
  document.head.appendChild(style);
}

/**
 * Parse configuration from script tag
 */
function parseConfigFromScript(): IJupyterEmbedBootstrapConfig | null {
  const script =
    document.currentScript ||
    document.querySelector('script[data-jupyter-server]');

  if (!script) return null;

  return {
    serverUrl: script.getAttribute('data-jupyter-server') || '',
    token: script.getAttribute('data-jupyter-token') || '',
    cdnBase:
      script.getAttribute('data-cdn-base') || getCdnBaseFromScript(script),
    autoStartKernel: script.getAttribute('data-auto-start-kernel') !== 'false',
    defaultKernel: script.getAttribute('data-default-kernel') || 'python',
  };
}

/**
 * Get CDN base URL from script src
 */
function getCdnBaseFromScript(script: Element): string {
  const src = script.getAttribute('src');
  if (!src) return '';

  // Extract base URL from script src
  const url = new URL(src, window.location.href);
  return `${url.origin}${url.pathname.replace(/\/[^/]+$/, '')}`;
}

/**
 * Detect which component types are needed on the page
 */
function detectRequiredComponents(): Set<ComponentType> {
  const elements = document.querySelectorAll('[data-jupyter-embed]');
  const types = new Set<ComponentType>();

  elements.forEach(el => {
    const type = el.getAttribute('data-type') as ComponentType;
    if (type) types.add(type);
  });

  return types;
}

/**
 * Show loading placeholder in an element
 */
function showPlaceholder(element: Element): void {
  // Don't add placeholder if already has content
  if (element.querySelector('.jupyter-embed-loading')) return;

  const placeholder = document.createElement('div');
  placeholder.className = 'jupyter-embed-loading';
  placeholder.innerHTML = `
    <div class="jupyter-embed-spinner"></div>
    <span>Loading Jupyter component...</span>
  `;
  element.appendChild(placeholder);
}

/**
 * Remove loading placeholder from an element
 */
function removePlaceholder(element: Element): void {
  const placeholder = element.querySelector('.jupyter-embed-loading');
  if (placeholder) {
    placeholder.remove();
  }
}

/**
 * Show error message in an element
 */
function showError(element: Element, message: string): void {
  removePlaceholder(element);

  const error = document.createElement('div');
  error.className = 'jupyter-embed-error';
  error.textContent = `Error: ${message}`;
  element.appendChild(error);
}

/**
 * Dynamically load a JavaScript chunk
 */
async function loadChunk(name: string): Promise<any> {
  if (loadedChunks.has(name)) {
    return; // Already loaded
  }

  const cdnBase = config?.cdnBase || '';
  const url = `${cdnBase}/chunks/${name}.js`;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      loadedChunks.add(name);
      resolve((window as any)[`JupyterEmbed_${name}`]);
    };

    script.onerror = () => {
      reject(new Error(`Failed to load chunk: ${name}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Load the core module (always required)
 */
async function loadCore(): Promise<any> {
  if (coreModule) return coreModule;

  const cdnBase = config?.cdnBase || '';
  const url = `${cdnBase}/chunks/core.js`;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      coreModule = (window as any).JupyterEmbedCore;
      resolve(coreModule);
    };

    script.onerror = () => {
      reject(new Error('Failed to load Jupyter Embed core'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Map component type to chunk name
 */
function getChunkForType(type: ComponentType): string {
  // Some components might share chunks
  const chunkMap: Record<ComponentType, string> = {
    cell: 'cell',
    notebook: 'notebook',
    terminal: 'terminal',
    console: 'console',
    output: 'output',
    viewer: 'viewer',
  };

  return chunkMap[type] || type;
}

/**
 * Initialize all Jupyter embeds on the page
 */
async function initJupyterEmbeds(): Promise<void> {
  // Inject loading styles
  injectLoadingStyles();

  // Parse configuration
  config = parseConfigFromScript();
  if (!config) {
    console.warn(
      '[JupyterEmbed] No configuration found. Add data-jupyter-server to your script tag.',
    );
    return;
  }

  // Detect required components
  const requiredTypes = detectRequiredComponents();
  if (requiredTypes.size === 0) {
    console.log('[JupyterEmbed] No embed elements found on page.');
    return;
  }

  console.log(
    '[JupyterEmbed] Detected component types:',
    Array.from(requiredTypes),
  );

  // Show loading placeholders
  document.querySelectorAll('[data-jupyter-embed]').forEach(showPlaceholder);

  try {
    // Load core first (always required)
    console.log('[JupyterEmbed] Loading core...');
    await loadCore();

    // Get unique chunks needed
    const chunksNeeded = new Set<string>();
    requiredTypes.forEach(type => {
      chunksNeeded.add(getChunkForType(type));
    });

    // Load required component chunks in parallel
    console.log('[JupyterEmbed] Loading chunks:', Array.from(chunksNeeded));
    await Promise.all(Array.from(chunksNeeded).map(chunk => loadChunk(chunk)));

    // Initialize components using core module
    if (coreModule && coreModule.initJupyterEmbeds) {
      coreModule.initJupyterEmbeds(config);
    }

    // Remove placeholders
    document
      .querySelectorAll('[data-jupyter-embed]')
      .forEach(removePlaceholder);

    console.log('[JupyterEmbed] Initialization complete.');
  } catch (error) {
    console.error('[JupyterEmbed] Failed to initialize:', error);

    // Show errors on all elements
    document.querySelectorAll('[data-jupyter-embed]').forEach(el => {
      showError(el, error instanceof Error ? error.message : 'Unknown error');
    });
  }
}

/**
 * Manually configure and initialize (for programmatic use)
 */
export function configure(options: IJupyterEmbedBootstrapConfig): void {
  config = options;
}

/**
 * Manually trigger initialization
 */
export async function init(): Promise<void> {
  await initJupyterEmbeds();
}

// Auto-initialization
function autoInit(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJupyterEmbeds);
  } else {
    // DOM already loaded, init immediately
    initJupyterEmbeds();
  }
}

// Check if auto-init is disabled
const currentScript = document.currentScript;
const autoInitDisabled =
  currentScript?.getAttribute('data-auto-init') === 'false';

if (!autoInitDisabled) {
  autoInit();
}

// Export for global access
(window as any).JupyterEmbed = {
  configure,
  init,
  initJupyterEmbeds,
};
