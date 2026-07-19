/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Jupyter context entry point
 *
 * This is a separate entry point for tree-shaking.
 * Import from '@datalayer/jupyter-react/jupyter' for smaller bundles.
 *
 * Contains:
 * - Jupyter provider component
 * - useJupyter hook
 * - Kernel management
 * - Jupyter services
 */

export * from './jupyter';
