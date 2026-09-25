/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What a host draws for the orchestration nodes of a document.
 *
 * An execution tree node stores which execution it is about and nothing more:
 * the tree itself is live — states, workers, artifacts — and only the host can
 * reach the service that knows it. So the host hands the renderer down, the
 * way it hands down what a YouTube embed does on click, and a document opened
 * where nobody provides one still says which execution it is about.
 *
 * @module context/OrchestrationRenderersContext
 */

import { createContext, useContext, type ReactNode } from 'react';

export interface OrchestrationRenderers {
  /** The live tree of one execution. */
  renderExecutionTree?: (props: { executionId: string }) => ReactNode;
}

export const OrchestrationRenderersContext =
  createContext<OrchestrationRenderers>({});

export function useOrchestrationRenderers(): OrchestrationRenderers {
  return useContext(OrchestrationRenderersContext);
}
