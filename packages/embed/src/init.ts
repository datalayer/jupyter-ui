/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  configureJupyterEmbed,
  parseConfigFromScript,
  getJupyterEmbedConfig,
} from './config';
import { parseElementOptions } from './parser';
import { renderEmbed, unmountAllEmbeds } from './components';
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
 * Initialize a single embed element
 */
function initializeElement(element: HTMLElement): void {
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
    renderEmbed(element, options);
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
          initializeElement(element);
        }
      });
    },
    {
      rootMargin: '100px', // Start loading slightly before element is visible
    },
  );
}

/**
 * Find and initialize all Jupyter embed elements in the document
 */
export function initJupyterEmbeds(
  container: HTMLElement = document.body,
): void {
  const config = getJupyterEmbedConfig();
  const selector = `[${DATA_ATTRIBUTES.JUPYTER_EMBED}]`;
  const elements = container.querySelectorAll<HTMLElement>(selector);

  if (elements.length === 0) {
    return;
  }

  console.log(`[jupyter-embed] Found ${elements.length} embed element(s)`);

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
      initializeElement(element);
    });
  }
}

/**
 * Initialize embeds that were added after page load
 */
export function initAddedJupyterEmbeds(
  container: HTMLElement = document.body,
): void {
  initJupyterEmbeds(container);
}

/**
 * Clean up all embeds and observers
 */
export function destroyJupyterEmbeds(): void {
  // Stop observing
  if (lazyLoadObserver) {
    lazyLoadObserver.disconnect();
    lazyLoadObserver = null;
  }

  pendingElements.clear();

  // Unmount all components
  unmountAllEmbeds();

  // Reset initialized flags
  document.querySelectorAll('[data-jupyter-initialized]').forEach(el => {
    el.removeAttribute('data-jupyter-initialized');
    el.removeAttribute('data-jupyter-initializing');
  });
}

/**
 * Auto-initialize on page load
 */
function autoInit(): void {
  // Find our script tag and parse config from it
  const scripts = document.querySelectorAll('script[src*="jupyter-embed"]');
  scripts.forEach(script => {
    const config = parseConfigFromScript(script as HTMLScriptElement);
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
  initJupyterEmbeds();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // DOM already loaded
    autoInit();
  }
}

// Export for manual initialization
export { autoInit };
