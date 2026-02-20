/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Collapsible CSS-in-JS styles.
 *
 * Inline styles are applied directly in each node's createDOM().
 * This module injects a minimal <style> tag (once) for pseudo-elements
 * and selectors that cannot be expressed as inline styles.
 */

const STYLE_ID = 'datalayer-collapsible-styles';

const COLLAPSIBLE_CSS = `
/* Collapsible title hover */
.Collapsible__title:hover {
  background-color: var(--bgColor-neutral-muted, rgba(0, 0, 0, 0.04));
}

/* Remove default paragraph margins inside title */
.Collapsible__title p {
  margin: 0 !important;
  padding: 0 !important;
  display: inline;
}

/* Aggressively hide default details marker */
.Collapsible__title::marker,
.Collapsible__title::-webkit-details-marker {
  display: none !important;
  content: none !important;
}
summary.Collapsible__title {
  list-style: none;
}
summary.Collapsible__title::-webkit-details-marker {
  display: none;
}
summary.Collapsible__title::marker {
  display: none;
}

/* Arrow icon - right arrow when closed */
.Collapsible__title::before {
  content: '▶';
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--fgColor-muted, #555);
  transition: all 0.15s ease;
  opacity: 0.9;
  display: inline-block;
  width: 12px;
  height: 12px;
  line-height: 12px;
  text-align: center;
}

/* Arrow icon - down arrow when open */
.Collapsible__container[open] > .Collapsible__title::before {
  content: '▼';
  opacity: 1;
}

/* Remove default paragraph margins inside content */
.Collapsible__content > p:first-child {
  margin-top: 0;
}
.Collapsible__content > p:last-child {
  margin-bottom: 0;
}

/* Collapsed state (for Chrome workaround) */
.Collapsible__collapsed .Collapsible__content {
  display: none;
  user-select: none;
}
`;

let injected = false;

/**
 * Ensures the collapsible stylesheet is injected into the document exactly once.
 * Call this from any createDOM that needs the styles.
 */
export function ensureCollapsibleStyles(): void {
  if (injected) {
    return;
  }
  if (typeof document === 'undefined') {
    return;
  }
  if (document.getElementById(STYLE_ID)) {
    injected = true;
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = COLLAPSIBLE_CSS;
  document.head.appendChild(style);
  injected = true;
}

/** Inline styles for .Collapsible__container */
export const containerStyles: Partial<CSSStyleDeclaration> = {
  background: 'var(--bgColor-muted, #f8f8f8)',
  border: '1px solid var(--borderColor-default, #e0e0e0)',
  borderRadius: '6px',
  margin: '12px 0',
  padding: '0',
  overflow: 'hidden',
};

/** Inline styles for .Collapsible__title */
export const titleStyles: Partial<CSSStyleDeclaration> = {
  cursor: 'pointer',
  padding: '12px 12px 12px 36px',
  position: 'relative',
  fontWeight: '600',
  fontSize: '14px',
  listStyle: 'none',
  display: 'block',
  outline: 'none',
  color: 'var(--fgColor-default, #333)',
  userSelect: 'none',
  transition: 'background-color 0.15s ease',
  margin: '0',
  // @ts-expect-error - vendor prefix not in CSSStyleDeclaration
  WebkitAppearance: 'none',
};

/** Inline styles for .Collapsible__content */
export const contentStyles: Partial<CSSStyleDeclaration> = {
  padding: '12px 16px 16px 36px',
};

/** Apply a style map to a DOM element */
export function applyStyles(
  dom: HTMLElement,
  styles: Partial<CSSStyleDeclaration>,
): void {
  for (const [key, value] of Object.entries(styles)) {
    if (value != null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dom.style as any)[key] = value;
    }
  }
}
