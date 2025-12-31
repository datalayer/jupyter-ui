/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Core chunk for Jupyter Embed
 * 
 * This chunk contains:
 * - React and ReactDOM
 * - Jupyter services and context
 * - Theme and common styles
 * - Initialization logic
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  JupyterReactTheme,
  useJupyter,
  Jupyter,
} from '@datalayer/jupyter-react';
import type { EmbedOptions } from '../types';
import { parseElementOptions } from '../parser';

// Store for React roots
const embedRoots = new Map<HTMLElement, Root>();

// Global config
let globalConfig: any = null;

// Loaded component renderers
const componentRenderers: Record<string, (el: HTMLElement, options: EmbedOptions) => void> = {};

/**
 * Register a component renderer from a chunk
 */
export function registerComponent(type: string, renderer: (el: HTMLElement, options: EmbedOptions) => void): void {
  componentRenderers[type] = renderer;
}

/**
 * Get the Jupyter wrapper component
 */
interface IJupyterWrapperProps {
  children: React.ReactNode;
  serverUrl: string;
  token: string;
  autoStartKernel?: boolean;
  defaultKernel?: string;
}

export const JupyterWrapper: React.FC<IJupyterWrapperProps> = ({
  children,
  serverUrl,
  token,
  autoStartKernel = true,
  defaultKernel = 'python',
}) => {
  return (
    <Jupyter
      jupyterServerUrl={serverUrl}
      jupyterServerToken={token}
      startDefaultKernel={autoStartKernel}
      defaultKernelName={defaultKernel}
      terminals={true}
    >
      <JupyterReactTheme>
        {children}
      </JupyterReactTheme>
    </Jupyter>
  );
};

/**
 * Render a component into an element
 */
export function renderEmbed(element: HTMLElement, options: EmbedOptions): void {
  const renderer = componentRenderers[options.type];
  
  if (!renderer) {
    console.error(`[JupyterEmbed] Unknown component type: ${options.type}`);
    return;
  }
  
  renderer(element, options);
}

/**
 * Create a React root for an element
 */
export function createEmbedRoot(element: HTMLElement): Root {
  let root = embedRoots.get(element);
  if (!root) {
    root = createRoot(element);
    embedRoots.set(element, root);
  }
  return root;
}

/**
 * Unmount an embed
 */
export function unmountEmbed(element: HTMLElement): void {
  const root = embedRoots.get(element);
  if (root) {
    root.unmount();
    embedRoots.delete(element);
  }
}

/**
 * Unmount all embeds
 */
export function unmountAllEmbeds(): void {
  embedRoots.forEach((root) => {
    root.unmount();
  });
  embedRoots.clear();
}

/**
 * Initialize all Jupyter embeds on the page
 */
export function initJupyterEmbeds(config?: any): void {
  if (config) {
    globalConfig = config;
  }
  
  const elements = document.querySelectorAll<HTMLElement>('[data-jupyter-embed]');
  
  elements.forEach(element => {
    // Skip if already initialized
    if (element.getAttribute('data-jupyter-initialized') === 'true') {
      return;
    }
    
    // Parse options from element
    const options = parseElementOptions(element);
    if (!options) {
      console.warn('[JupyterEmbed] Could not parse options for element:', element);
      return;
    }
    
    // Mark as initialized
    element.setAttribute('data-jupyter-initialized', 'true');
    
    // Render the component
    renderEmbed(element, options);
  });
}

/**
 * Get the global config
 */
export function getConfig(): any {
  return globalConfig;
}

// Export for chunk registration
export {
  React,
  createRoot,
  JupyterReactTheme,
  useJupyter,
};

// Export types
export type { EmbedOptions };

// Make available globally for chunks
(window as any).JupyterEmbedCore = {
  registerComponent,
  renderEmbed,
  createEmbedRoot,
  unmountEmbed,
  unmountAllEmbeds,
  initJupyterEmbeds,
  getConfig,
  JupyterWrapper,
  React,
  createRoot,
  JupyterReactTheme,
  useJupyter,
};
