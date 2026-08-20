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
