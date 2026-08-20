/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { syncPortalThemeStyles } from '@datalayer/primer-addons';

/** The class JupyterLab scopes its themed rules to. */
const THEMED_CONTAINER_CLASS = 'jp-ThemedContainer';

/** Where Primer renders dialogs, menus and tooltips. */
const PORTAL_ROOT_SELECTOR = '#__primerPortalRoot__';

/** The stylesheet this module owns, rewritten from scratch on every sync. */
const MIRROR_STYLE_ID = 'dla-JupyterLab-portal-theme';

/**
 * Whether a page asked for this bridge.
 *
 * Only a JupyterLab does, from its entry point. It is what separates a view
 * asking for the bridge to be applied again from a page turning it on.
 */
let engaged = false;

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
 * A JupyterLab ASKS for this; no component decides it. The portal root is
 * a single element for the whole document, and what is written on it holds
 * for every overlay the page opens — not only for the ones belonging to the
 * view that happens to be on screen. An application that shows a notebook
 * among its own pages, as the Datalayer web application does, would have
 * every menu and every dialog of the application repainted in the theme of
 * JupyterLab by the mere presence of that notebook. So the call belongs to
 * the ENTRY POINT of a JupyterLab, beside `setupPrimerPortals()`: the
 * extension of the pip distribution, and the applications that run a
 * JupyterLab as a React page. Nowhere else — a `JupyterReactTheme` that
 * mounts is not the page becoming a JupyterLab.
 *
 * That one call holds for the lifetime of the page: the values below are
 * indirections rather than snapshots, so a change of theme needs no second
 * call. Rules that arrive later are picked up by
 * `refreshJupyterLabPortalTheme`, which a view may ask for freely — it does
 * nothing on a page that never engaged the bridge.
 */
export function syncJupyterLabPortalTheme(): void {
  engaged = true;
  applyJupyterLabPortalTheme();
}

function applyJupyterLabPortalTheme(): void {
  mirrorThemedRulesOntoPortalRoot();
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
 * Give portaled content the rules the theme scopes to its container.
 *
 * What makes a control look like the application is not a token but a
 * RULE: JupyterLab scopes the border radius, the UI font and the focus
 * ring to `.jp-ThemedContainer button`, and jupyter-react maps the brand
 * colour of the buttons the same way. JupyterLab puts that class on its
 * SHELL, and where the shell is decides whether overlays inherit any of
 * it: an installed extension runs in a JupyterLab whose shell is the body,
 * so the portal root — a child of the body — is inside it and its content
 * is themed; a React application mounts JupyterLab into a div of its own,
 * leaving the portal root a sibling of the shell and every dialog drawn in
 * Primer's default look.
 *
 * Each such rule is copied here with the container swapped for the portal
 * root, so whatever the theme states about the things INSIDE it holds for
 * the overlays too — the rules written today and the ones added later, for
 * any theme, with no list of tokens to keep in step.
 *
 * Rules dressing the CONTAINER ITSELF are deliberately left behind. They
 * are structural — this application gives `.jp-ThemedContainer` an
 * `overflow: hidden` and a background — and the portal root is the element
 * Primer measures its anchored overlays against: clipped and turned into a
 * scroll container, it displaced them off the screen, which reads as a menu
 * that refuses to open.
 */
function mirrorThemedRulesOntoPortalRoot(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const mirrored: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if ((sheet.ownerNode as HTMLElement | null)?.id === MIRROR_STYLE_ID) {
      continue;
    }
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // A stylesheet of another origin cannot be read; nothing to mirror.
      continue;
    }
    collectMirroredRules(rules, mirrored);
  }
  styleElement().textContent = mirrored.join('\n');
}

/**
 * Apply the bridge again, for a page that asked for it and for no other.
 *
 * Two things move under it. The rules copied below are only as complete as
 * the document was when they were copied, and a JupyterLab is not finished
 * loading when its entry point runs: the ones jupyter-react scopes to the
 * themed container — the brand colour of the buttons among them — are
 * written by styled-components as the first themed view renders, INTO an
 * existing stylesheet through the CSSOM, which changes no node of the
 * document and so cannot be watched for. And the tokens are written inline
 * on a portal root every theme provider of the page writes on in turn, so
 * the last to render decides. The view that brings either says so here.
 *
 * Saying so is not asking for it: on a page that never engaged the bridge —
 * a web application showing a notebook among its own pages — this does
 * nothing at all, and the overlays of the application keep the theme of the
 * application.
 */
export function refreshJupyterLabPortalTheme(): void {
  if (!engaged) {
    return;
  }
  applyJupyterLabPortalTheme();
}

/** Walk a rule list, keeping the conditions (`@media`, `@supports`) around. */
function collectMirroredRules(rules: CSSRuleList, out: string[]): void {
  for (const rule of Array.from(rules)) {
    const styleRule = rule as CSSStyleRule;
    const groupingRule = rule as CSSGroupingRule;
    if (!styleRule.selectorText && groupingRule.cssRules) {
      const inner: string[] = [];
      collectMirroredRules(groupingRule.cssRules, inner);
      if (inner.length) {
        // The condition is rebuilt around the mirrored rules alone: the
        // `cssText` of a grouping rule carries its whole body with it.
        const prelude = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim();
        out.push(`${prelude} {\n${inner.join('\n')}\n}`);
      }
      continue;
    }
    if (!styleRule.selectorText || !styleRule.style) {
      continue;
    }
    const selector = mirrorSelector(styleRule.selectorText);
    if (selector) {
      out.push(`${selector} { ${styleRule.style.cssText} }`);
    }
  }
}

/**
 * The selector as it applies under the portal root, or nothing.
 *
 * Nothing when no part of it reaches INSIDE the themed container: a
 * selector naming the container alone dresses the container, and the
 * portal root must keep its own box.
 */
function mirrorSelector(selectorText: string): string | undefined {
  const mirrored = selectorText
    .split(',')
    .map(part => part.trim())
    .filter(part => part.includes(THEMED_CONTAINER_CLASS))
    .filter(targetsDescendant)
    .map(part =>
      part.replace(
        new RegExp(`\\.${THEMED_CONTAINER_CLASS}\\b`, 'g'),
        PORTAL_ROOT_SELECTOR
      )
    );
  return mirrored.length ? mirrored.join(', ') : undefined;
}

/** Whether the selector matches something BELOW the themed container. */
function targetsDescendant(selectorPart: string): boolean {
  // The last compound is what the selector matches; the container is only
  // an ancestor of it when it appears before a combinator.
  const compounds = selectorPart.split(/[\s>+~]+/).filter(Boolean);
  const last = compounds[compounds.length - 1] ?? '';
  return compounds.length > 1 && !last.includes(THEMED_CONTAINER_CLASS);
}

function styleElement(): HTMLStyleElement {
  const existing = document.getElementById(
    MIRROR_STYLE_ID
  ) as HTMLStyleElement | null;
  if (existing) {
    return existing;
  }
  const style = document.createElement('style');
  style.id = MIRROR_STYLE_ID;
  // Last in the head, so it carries the weight of the rules it copies.
  document.head.appendChild(style);
  return style;
}

export default syncJupyterLabPortalTheme;
