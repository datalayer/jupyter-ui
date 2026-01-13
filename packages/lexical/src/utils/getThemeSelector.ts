/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { EditorThemeClasses } from 'lexical';

export function getThemeSelector(
  getTheme: () => EditorThemeClasses | null | undefined,
  name: keyof EditorThemeClasses,
): string {
  const className = getTheme()?.[name];
  if (typeof className !== 'string') {
    throw new Error(
      `getThemeClass: required theme property ${name} not defined`,
    );
  }
  return className
    .split(/\s+/g)
    .map(cls => `.${cls}`)
    .join();
}
