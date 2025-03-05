/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

export function isHTMLElement(x: unknown): x is HTMLElement {
  return x instanceof HTMLElement;
}
