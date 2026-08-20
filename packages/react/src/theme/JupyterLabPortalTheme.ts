/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import {
  getPrimerPortalRoot,
  syncPortalThemeStyles,
} from '@datalayer/primer-addons';

/** The class JupyterLab scopes its themed rules to. */
const JUPYTERLAB_THEMED_CONTAINER = 'jp-ThemedContainer';

/**
 * The theme of a JupyterLab page reaches Primer's PORTALS as well.
 *
 * A dialog, a menu, a tooltip renders under the portal root — a child of
 * the body, outside the element `BaseStyles` themes — and Primer's own
 * stylesheet defines the `--bgColor-*`/`--fgColor-*` palette ON any
 * element carrying `data-color-mode`. So the page wore the JupyterLab
 * theme while every overlay came out in Primer's default one. The bridge
 * below redefines those tokens from the `--jp-*` variables, inline on the
 * portal root, where they outrank the stylesheet; the `var()` indirection
 * keeps them live when JupyterLab switches theme.
 *
 * One call is enough for the lifetime of the page — the values are
 * indirections, not snapshots — so it belongs wherever a portal root is
 * set up on a JupyterLab page: `JupyterReactTheme` calls it when it themes
 * itself after JupyterLab, and a JupyterLab extension entry calls it right
 * after `setupPrimerPortals()`, so even an overlay opened before any theme
 * provider mounts comes out in the theme of the page.
 */
export function syncJupyterLabPortalTheme(): void {
  markPortalRootAsThemedContainer();
  // Custom properties are outside the CSSProperties type, by design.
  syncPortalThemeStyles({
    fontFamily: 'var(--jp-ui-font-family, sans-serif)',
    fontSize: 'var(--jp-ui-font-size1, 13px)',
    '--fontStack-sansSerif': 'var(--jp-ui-font-family, sans-serif)',
    '--fontStack-monospace': 'var(--jp-code-font-family, monospace)',
    '--bgColor-default': 'var(--jp-layout-color1, #ffffff)',
    '--bgColor-muted': 'var(--jp-layout-color2, #f5f5f5)',
    '--bgColor-inset': 'var(--jp-layout-color0, #ffffff)',
    '--fgColor-default': 'var(--jp-ui-font-color1, #333333)',
    '--fgColor-muted': 'var(--jp-ui-font-color2, #666666)',
    '--borderColor-default': 'var(--jp-border-color1, #e0e0e0)',
    '--borderColor-muted': 'var(--jp-border-color2, #eeeeee)',
    '--fgColor-accent': 'var(--jp-brand-color1, #1976d2)',
  } as Parameters<typeof syncPortalThemeStyles>[0]);
}

/**
 * Make the portal root a themed container of JupyterLab.
 *
 * What gives a control the look of the application is not a token but a
 * RULE: JupyterLab scopes `border-radius`, the UI font and the focus ring
 * to `.jp-ThemedContainer button`, and jupyter-react maps the brand colour
 * the same way. JupyterLab puts that class on its SHELL — which is the body
 * under an installed extension, so portaled content is inside it and themed
 * by accident, and a div of its own in a React application, leaving the
 * portal root outside it and every overlay drawn in Primer's default look.
 *
 * Marking the root itself is what closes that gap for good: every rule the
 * theme scopes to that class reaches the overlays, the ones written today
 * and the ones added later, without a list of tokens to keep in step. It
 * relies on the root being pinned to the origin of the document, which is
 * where `setupPrimerPortals` puts it — left in the flow of the body, the
 * layout rules that come with the class displace the element Primer
 * measures its overlays against.
 */
function markPortalRootAsThemedContainer(): void {
  getPrimerPortalRoot()?.classList.add(JUPYTERLAB_THEMED_CONTAINER);
}

export default syncJupyterLabPortalTheme;
