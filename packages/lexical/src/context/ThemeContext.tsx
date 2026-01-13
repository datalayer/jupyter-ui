/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Theme context for accessing application theme in lexical components.
 * This allows components to access the theme provided by the parent application.
 *
 * @module context/ThemeContext
 */

import { createContext, useContext } from 'react';

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

/**
 * Hook to access the current theme from parent application.
 * Returns "light" as default if no theme is provided.
 *
 * @returns The current theme ("light" or "dark")
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme } = useTheme();
 *   return <Excalidraw theme={theme} />;
 * }
 * ```
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  // Return default theme if not in a provider (e.g., standalone usage)
  return context ?? { theme: 'light' };
}
