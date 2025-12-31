/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lazy initialization module
 * Uses the lazy-loading components for reduced initial bundle size
 */

import {
  configureJupyterEmbed,
  parseConfigFromScript,
  getJupyterEmbedConfig,
} from './config';
import { parseElementOptions } from './parser';
import { renderEmbedLazy, unmountAllEmbedsLazy } from './components-lazy';
import { DATA_ATTRIBUTES } from './types';

/**
 * IntersectionObserver for lazy loading
 */
let lazyLoadObserver: IntersectionObserver | null = null;

/**
 * Elements waiting to be initialized
 */
const pendingElements = new Set<HTMLElement>();

/**
 * Initialize a single embed element (lazy version)
 */
function initializeElementLazy(element: HTMLElement): void {
  // Skip if already initialized
  if (element.getAttribute('data-jupyter-initialized') === 'true') {
    return;
  }

  const options = parseElementOptions(element);
  if (!options) {
    return;
  }

  // Mark as initializing
  element.setAttribute('data-jupyter-initializing', 'true');

  try {
    renderEmbedLazy(element, options);
    element.setAttribute('data-jupyter-initialized', 'true');
    element.removeAttribute('data-jupyter-initializing');

    // Make visible (in case CSS hides uninitialized elements)
    element.style.visibility = 'visible';
  } catch (error) {
    console.error('[jupyter-embed] Failed to initialize element:', error);
    element.removeAttribute('data-jupyter-initializing');
    element.setAttribute('data-jupyter-error', 'true');
  }
}

/**
 * Setup lazy loading observer
 */
function setupLazyLoadObserver(): void {
  if (lazyLoadObserver) {
    return;
  }

  lazyLoadObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          lazyLoadObserver?.unobserve(element);
          pendingElements.delete(element);
          initializeElementLazy(element);
        }
      });
    },
    {
      rootMargin: '100px', // Start loading slightly before element is visible
    },
  );
}

/**
 * Find and initialize all Jupyter embed elements in the document (lazy version)
 */
export function initJupyterEmbedsLazy(
  container: HTMLElement = document.body,
): void {
  const config = getJupyterEmbedConfig();
  const selector = `[${DATA_ATTRIBUTES.JUPYTER_EMBED}]`;
  console.log('[jupyter-embed] Looking for selector:', selector);
  const elements = container.querySelectorAll<HTMLElement>(selector);

  console.log(`[jupyter-embed] Found ${elements.length} embed element(s)`);

  if (elements.length === 0) {
    return;
  }

  console.log(
    `[jupyter-embed] Initializing ${elements.length} embed element(s) (lazy mode), lazyLoad=${config.lazyLoad}`,
  );

  if (config.lazyLoad) {
    setupLazyLoadObserver();

    elements.forEach(element => {
      if (element.getAttribute('data-jupyter-initialized') !== 'true') {
        pendingElements.add(element);
        lazyLoadObserver?.observe(element);
      }
    });
  } else {
    // Initialize all elements immediately
    elements.forEach(element => {
      initializeElementLazy(element);
    });
  }
}

/**
 * Initialize embeds that were added after page load (lazy version)
 */
export function initAddedJupyterEmbedsLazy(
  container: HTMLElement = document.body,
): void {
  initJupyterEmbedsLazy(container);
}

/**
 * Clean up all embeds and observers (lazy version)
 */
export function destroyJupyterEmbedsLazy(): void {
  // Stop observing
  if (lazyLoadObserver) {
    lazyLoadObserver.disconnect();
    lazyLoadObserver = null;
  }

  pendingElements.clear();

  // Unmount all components
  unmountAllEmbedsLazy();

  // Reset initialized flags
  document.querySelectorAll('[data-jupyter-initialized]').forEach(el => {
    el.removeAttribute('data-jupyter-initialized');
    el.removeAttribute('data-jupyter-initializing');
  });
}

/**
 * Auto-initialize on page load (lazy version)
 */
function autoInitLazy(): void {
  console.log('[jupyter-embed] autoInitLazy called');
  
  // Find our script tag and parse config from it
  const scripts = document.querySelectorAll('script[src*="jupyter-embed"]');
  console.log('[jupyter-embed] Found script tags:', scripts.length);
  scripts.forEach(script => {
    const config = parseConfigFromScript(script as HTMLScriptElement);
    console.log('[jupyter-embed] Parsed config from script:', config);
    if (Object.keys(config).length > 0) {
      configureJupyterEmbed(config);
    }
  });

  // Also check for a config script tag
  const configScript = document.querySelector(
    'script[data-jupyter-embed-config]',
  );
  if (configScript?.textContent) {
    try {
      const config = JSON.parse(configScript.textContent);
      configureJupyterEmbed(config);
    } catch (e) {
      console.warn('[jupyter-embed] Failed to parse config script:', e);
    }
  }

  // Initialize all embeds
  initJupyterEmbedsLazy();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitLazy);
  } else {
    // DOM already loaded
    autoInitLazy();
  }
}

// Export for manual initialization
export { autoInitLazy };
