/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Manual initialization module (no auto-init)
 * This version does NOT auto-initialize on page load.
 * User must call initJupyterEmbeds() manually.
 */

import { getJupyterEmbedConfig } from './config';
export { configureJupyterEmbed, parseConfigFromScript } from './config';
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
  const elements = container.querySelectorAll<HTMLElement>(selector);

  if (elements.length === 0) {
    return;
  }

  console.log(
    `[jupyter-embed] Found ${elements.length} embed element(s) (lazy mode)`,
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

// NO AUTO-INIT - user must call initJupyterEmbedsLazy() manually
