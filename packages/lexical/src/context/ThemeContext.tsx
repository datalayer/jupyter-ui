/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Light or dark, for the components that have to draw it themselves.
 *
 * Most of the editor takes its colours from CSS variables and needs to know
 * nothing. Excalidraw is the exception: it rasterizes a scene, so it has to be
 * *told* which mode to export in — `exportWithDarkMode` for the rendered image,
 * `theme` for the editing canvas — and getting it wrong means a diagram drawn
 * in black ink on a black document.
 *
 * A host can state the mode by rendering `ThemeContext.Provider`, and one that
 * does still wins. But requiring that of every consumer is what left the
 * agent-runtimes examples with light drawings on dark documents: the default
 * was the literal string `'light'`, so an application that themed everything
 * else correctly still got this wrong, and could only find out by looking at a
 * picture. So the default is no longer a guess — see {@link useDomColormode}.
 *
 * @module context/ThemeContext
 */

import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeType;
}

/**
 * Context for providing theme to lexical components.
 * Parent application should provide this context.
 */
export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

/** The attribute Primer writes the resolved colour mode to. */
const COLOR_MODE_ATTRIBUTE = 'data-color-mode';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** What the system is set to, when the answer is "follow the system". */
function systemColormode(): ThemeType {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/**
 * The nearest element that states a colour mode, and what it says.
 *
 * Anchored on the component's own element rather than on the document, because
 * a page may hold more than one themed region — a dark editor beside a light
 * panel — and the one that governs a component is the closest enclosing
 * provider, exactly as CSS would resolve it.
 */
function readColormode(from: Element | null): {
  source: Element | null;
  mode: ThemeType;
} {
  if (typeof document === 'undefined') {
    return { source: null, mode: 'light' };
  }
  const source =
    from?.closest(`[${COLOR_MODE_ATTRIBUTE}]`) ??
    // No element yet (the first render, before the ref is attached) or one
    // outside any provider: fall back to whatever the page declares.
    document.querySelector(`[${COLOR_MODE_ATTRIBUTE}]`);
  const declared = source?.getAttribute(COLOR_MODE_ATTRIBUTE);
  if (declared === 'dark' || declared === 'light') {
    return { source, mode: declared };
  }
  // `auto`, or nothing at all.
  return { source, mode: systemColormode() };
}

/**
 * The colour mode in effect around `element`, kept up to date.
 *
 * Reads Primer's `data-color-mode`, which every Datalayer surface ends up
 * carrying: `DatalayerThemeProvider`, `JupyterReactTheme` and Primer's own
 * `ThemeProvider` all write it, whichever store the application keeps its
 * preference in. That is the point — a component in this package cannot know
 * whether its host uses the primer-addons singleton, an application store of
 * its own, or JupyterLab's theme manager, but it can read what they all agree
 * to put on the DOM.
 *
 * Live, because the mode is a thing people toggle: the attribute is watched
 * where it is declared, new providers appearing anywhere are picked up, and
 * `auto` follows the system preference as it changes.
 */
export function useDomColormode(element?: Element | null): ThemeType {
  const [mode, setMode] = useState<ThemeType>(() => readColormode(null).mode);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    let source: Element | null = null;
    let attributeObserver: MutationObserver | null = null;

    const resolve = () => {
      const next = readColormode(element ?? null);
      setMode(next.mode);
      if (next.source !== source) {
        source = next.source;
        attributeObserver?.disconnect();
        if (source) {
          attributeObserver = new MutationObserver(() => resolve());
          attributeObserver.observe(source, {
            attributes: true,
            attributeFilter: [COLOR_MODE_ATTRIBUTE],
          });
        }
      }
    };

    resolve();

    /*
     * A provider can also appear, move or be replaced rather than merely
     * change its attribute — a theme switch that remounts the tree does
     * exactly that, and the attribute observer above is by then watching a
     * detached node. Watching the document for the attribute catches it.
     */
    const treeObserver = new MutationObserver(() => resolve());
    treeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [COLOR_MODE_ATTRIBUTE],
      childList: true,
      subtree: true,
    });

    const media = window.matchMedia?.(DARK_QUERY);
    const onSystemChange = () => resolve();
    media?.addEventListener?.('change', onSystemChange);

    return () => {
      attributeObserver?.disconnect();
      treeObserver.disconnect();
      media?.removeEventListener?.('change', onSystemChange);
    };
  }, [element]);

  return mode;
}

/**
 * The current theme, for a component that has to render it.
 *
 * An explicit `ThemeContext` wins; otherwise the mode is read off the DOM.
 *
 * @param element - The component's own element, when it has one. Given, the
 *   answer comes from the nearest enclosing themed region; omitted, from the
 *   page. Pass it whenever a ref is available — it is what makes two
 *   differently-themed editors on one page each get their own answer.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [node, setNode] = useState<HTMLDivElement | null>(null);
 *   const { theme } = useTheme(node);
 *   return <div ref={setNode}><Excalidraw theme={theme} /></div>;
 * }
 * ```
 */
export function useTheme(element?: Element | null): ThemeContextValue {
  const provided = useContext(ThemeContext);
  // Called unconditionally: a hook cannot be skipped because a provider
  // happened to be there, and the observers it installs are cheap.
  const detected = useDomColormode(element);
  return provided ?? { theme: detected };
}
