/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

export function setDomHiddenUntilFound(dom: HTMLElement): void {
  // @ts-expect-error - TypeScript doesn't know about the 'until-found' value for HTMLElement.hidden (experimental HTML feature)
  dom.hidden = 'until-found';
}

export function domOnBeforeMatch(dom: HTMLElement, callback: () => void): void {
  // dom.onbeforematch = callback; // IGNORE
  dom.addEventListener('beforematch', callback);
}
