/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

// Setup Prism globally FIRST - must be before all other imports
import './setup-prism';

import { createRoot } from 'react-dom/client';
import { coreStore, iamStore } from '@datalayer/core';
import { useSimpleAuthStore } from '@datalayer/core/lib/views/otel';
import { useExampleThemeStore } from './themeStore';

import '../../style/primer-primitives.css';
import '../../style/index.css';

const PROD_RUN_URL = 'https://prod1.datalayer.run';

/**
 * jupyter-react's `loadJupyterConfig` reads the `jupyter-config-data` DOM
 * element (falling back to a hard-coded `oss.datalayer.run` default when it is
 * absent). The lexical examples only ship a `datalayer-config-data` element, so
 * we mirror the relevant fields into a `jupyter-config-data` element to ensure
 * every `useJupyter()` call targets the configured Jupyter server instead of
 * the `oss.datalayer.run` fallback.
 */
const ensureJupyterConfigData = (
  jupyterServerUrl: string,
  jupyterServerToken: string,
) => {
  const baseUrl = jupyterServerUrl.replace(/\/$/, '');
  const payload = {
    baseUrl,
    wsUrl: baseUrl.replace(/^http/, 'ws'),
    token: jupyterServerToken,
    appName: '',
  };
  let element = document.getElementById('jupyter-config-data');
  if (!element) {
    element = document.createElement('script');
    element.id = 'jupyter-config-data';
    (element as HTMLScriptElement).type = 'application/json';
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(payload);
};

const loadCoreConfiguration = () => {
  const datalayerConfigElement = document.getElementById(
    'datalayer-config-data',
  );
  if (!datalayerConfigElement?.textContent) {
    ensureJupyterConfigData(`${PROD_RUN_URL}/api/jupyter-server`, '');
    coreStore.getState().setConfiguration({
      datalayerUrl: PROD_RUN_URL,
      spacerUrl: PROD_RUN_URL,
    });
    return;
  }

  try {
    const raw = JSON.parse(datalayerConfigElement.textContent) as Record<
      string,
      unknown
    >;

    const envToken = (
      import.meta as ImportMeta & {
        env?: { VITE_DATALAYER_API_KEY?: string };
      }
    ).env?.VITE_DATALAYER_API_KEY;
    const rawToken = typeof raw.token === 'string' ? raw.token : '';
    const token =
      rawToken && !rawToken.startsWith('%VITE_') ? rawToken : envToken || '';

    const runUrlCandidate =
      (typeof raw.datalayerUrl === 'string' && raw.datalayerUrl) ||
      (typeof raw.runUrl === 'string' && raw.runUrl) ||
      PROD_RUN_URL;
    const runUrl = runUrlCandidate.replace(/\/$/, '');

    const spacerUrlCandidate =
      (typeof raw.spacerUrl === 'string' && raw.spacerUrl) || runUrl;
    const spacerUrl = spacerUrlCandidate.replace(/\/$/, '');

    const jupyterServerUrl =
      (typeof raw.jupyterServerUrl === 'string' && raw.jupyterServerUrl) ||
      `${runUrl}/api/jupyter-server`;
    const jupyterServerToken =
      (typeof raw.jupyterServerToken === 'string' && raw.jupyterServerToken) ||
      token ||
      '';
    ensureJupyterConfigData(jupyterServerUrl, jupyterServerToken);

    coreStore.getState().setConfiguration({
      datalayerUrl: runUrl,
      iamUrl: runUrl,
      spacerUrl,
      token,
      credits:
        typeof raw.credits === 'number'
          ? raw.credits
          : Number(raw.credits || 100),
      cpuEnvironment:
        typeof raw.cpuEnvironment === 'string'
          ? raw.cpuEnvironment
          : 'ai-agents-env',
      gpuEnvironment:
        typeof raw.gpuEnvironment === 'string' ? raw.gpuEnvironment : 'ai-env',
    });

    if (token) {
      useSimpleAuthStore.getState().setAuth(token, 'api-key-user');
      iamStore.setState({ token });
    }
  } catch (error) {
    console.error('Failed to parse datalayer-config-data:', error);
    ensureJupyterConfigData(`${PROD_RUN_URL}/api/jupyter-server`, '');
    coreStore.getState().setConfiguration({
      datalayerUrl: PROD_RUN_URL,
      spacerUrl: PROD_RUN_URL,
    });
  }
};

loadCoreConfiguration();

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

const urlParams = new URLSearchParams(window.location.search);
const isStandalone = urlParams.get('standalone') === 'true';

const renderStandaloneExample = async (examplePath: string) => {
  switch (examplePath) {
    case 'LexicalCollaborative': {
      const module = await import('./LexicalCollaborative');
      root.render(<module.default />);
      return;
    }
    case 'LexicalNbformat': {
      const module = await import('./LexicalNbformat');
      root.render(<module.default />);
      return;
    }
    case 'Notebook': {
      const module = await import('./Notebook');
      root.render(<module.default />);
      return;
    }
    case 'LexicalSimple':
    default: {
      const module = await import('./LexicalSimple');
      root.render(<module.LexicalSimple />);
    }
  }
};

if (isStandalone) {
  const examplePath = urlParams.get('example') || 'LexicalSimple';

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', event => {
      if (!event.key || !event.key.includes('jupyter-lexical-examples-theme')) {
        return;
      }
      const persist = (
        useExampleThemeStore as unknown as {
          persist?: { rehydrate?: () => void };
        }
      ).persist;
      if (persist?.rehydrate) {
        persist.rehydrate();
      }
    });
  }

  void renderStandaloneExample(examplePath);
} else {
  void import('./Examples').then(module => {
    root.render(<module.default />);
  });
}
