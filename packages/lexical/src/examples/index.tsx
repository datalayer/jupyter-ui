/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

// Setup Prism globally FIRST - must be before all other imports
import './setup-prism';

import { createRoot } from 'react-dom/client';
import { setupPrimerPortals } from '@datalayer/primer-addons';
import { App as AppSimple } from './AppSimple';
import AppCollaborative from './AppCollaborative';
import Examples from './Examples';
import { useExampleThemeStore } from './themeStore';

import '../../style/index.css';

// Ensure Primer portals (Dialog, Tooltip, etc.) render correctly on document.body
setupPrimerPortals();

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

const urlParams = new URLSearchParams(window.location.search);
const isStandalone = urlParams.get('standalone') === 'true';

if (isStandalone) {
  const examplePath = urlParams.get('example') || 'AppSimple';
  const modules: Record<string, JSX.Element> = {
    AppSimple: <AppSimple />,
    AppCollaborative: <AppCollaborative />,
  };

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

  root.render(modules[examplePath] ?? <AppSimple />);
} else {
  root.render(<Examples />);
}
