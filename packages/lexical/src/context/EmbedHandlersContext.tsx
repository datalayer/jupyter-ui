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

import { createContext, useContext } from 'react';

/**
 * Handlers for customizing embed behavior in different environments.
 * Allows consuming applications (VS Code, web, mobile) to provide
 * environment-specific implementations for embed interactions.
 */
export interface EmbedHandlers {
  /**
   * Called when a YouTube embed is clicked.
   * If not provided, falls back to default iframe embed.
   *
   * @param videoID - YouTube video ID
   */
  onYouTubeClick?: (videoID: string) => void;
}

/**
 * Context for providing environment-specific embed handlers.
 * Use this to customize how embeds behave in different environments.
 *
 * @example
 * ```tsx
 * // In VS Code extension
 * <EmbedHandlersContext.Provider value={{ onYouTubeClick: handleYouTubeClick }}>
 *   <LexicalComposer>...</LexicalComposer>
 * </EmbedHandlersContext.Provider>
 * ```
 */
export const EmbedHandlersContext = createContext<EmbedHandlers>({});

/**
 * Hook to access embed handlers from context.
 *
 * @returns Current embed handlers
 */
export function useEmbedHandlers(): EmbedHandlers {
  return useContext(EmbedHandlersContext);
}
