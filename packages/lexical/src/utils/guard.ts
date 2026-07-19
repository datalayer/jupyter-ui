/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

export function isHTMLElement(x: unknown): x is HTMLElement {
  return x instanceof HTMLElement;
}
