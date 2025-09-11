/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import { registerPortalRoot } from '@primer/react';
import { Colormode } from '../JupyterLabColormode';

import '@primer/react-brand/lib/css/main.css';

const PRIMER_PORTAL_ROOT_ID = '__primerPortalRoot__';

/**
 * Ensure we define a root for Primer portal root.
 *
 *  @see https://github.com/primer/react/blob/main/packages/react/src/Portal/Portal.tsx#L23
 *  @see https://github.com/primer/react/blob/030fe020b48b7f12c2994c6614e5d4191fe764ee/src/Portal/Portal.tsx#L33
 */
export const setupPrimerPortals = (colormode: Colormode = 'light') => {
  console.log('-------------------------DLA', colormode);
  const body = document.body;
  body.dataset['portalRoot'] = 'true';
  body.dataset['colorMode'] = colormode;
  body.dataset['lightTheme'] = 'light';
  body.dataset['darkTheme'] = 'dark';
  body.id = PRIMER_PORTAL_ROOT_ID;
  registerPortalRoot(body);
};

export default setupPrimerPortals;
