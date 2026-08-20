/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { syncPortalThemeStyles } from '@datalayer/primer-addons';

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
    /*
     * The BUTTONS of an overlay, after JupyterLab rather than after Primer.
     *
     * On the page these three come from a rule `JupyterLabCss` scopes to
     * `.jp-ThemedContainer button`, and JupyterLab puts that class on its
     * SHELL: under an installed extension the shell is the body, so a
     * portaled button is inside it, while a React application mounting
     * JupyterLab into a div of its own leaves the portal root outside — and
     * every dialog button came out in Primer's default green.
     *
     * Carried as tokens rather than by borrowing the class. Marking this
     * root `jp-ThemedContainer` did make the buttons right, and brought the
     * layout rules of JupyterLab with it onto an element Primer measures
     * against: the wrapper Primer positions its overlays in was displaced,
     * and menus opened off the screen. Tokens theme without relayouting.
     */
    '--button-primary-bgColor-rest': 'var(--jp-brand-color1, #1976d2)',
    '--button-primary-bgColor-hover': 'var(--jp-brand-color0, #0d47a1)',
    '--button-primary-bgColor-active': 'var(--jp-brand-color0, #3a4047ff)',
  } as Parameters<typeof syncPortalThemeStyles>[0]);
}

export default syncJupyterLabPortalTheme;
