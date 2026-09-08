/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What the model is told the Excalidraw tools do.
 *
 * These descriptions are the whole of the model's knowledge of the feature,
 * so they carry the two things it cannot work out for itself: that a drawing
 * is addressed by the `block_id` of its block, and that shapes are addressed
 * by an element id that only comes from reading the scene. Everything else —
 * how to draw a flowchart, what a sensible arrow looks like — it already
 * knows.
 *
 * @module plugins/excalidraw/definitions
 */

import { zodToToolParameters } from '@datalayer/jupyter-react/tools';
import type { ToolDefinition } from '../../tools/core';

import {
  excalidrawAddElementsParamsSchema,
  excalidrawClearSceneParamsSchema,
  excalidrawConnectElementsParamsSchema,
  excalidrawDeleteElementsParamsSchema,
  excalidrawFromMermaidParamsSchema,
  excalidrawInsertNodeParamsSchema,
  excalidrawListDrawingsParamsSchema,
  excalidrawReadSceneParamsSchema,
  excalidrawResizeParamsSchema,
  excalidrawSetAppStateParamsSchema,
  excalidrawUpdateElementsParamsSchema,
} from './schemas';

/** The vendor prefix every Datalayer tool name carries. */
const NAME = (tool: string) => `datalayer_${tool}`;

/** Shared by everything that only rearranges a drawing nobody is looking at. */
const QUIET = {
  requiresConfirmation: false,
  canBeReferencedInPrompt: true,
  priority: 'medium' as const,
};

const TAGS = ['lexical', 'excalidraw', 'drawing', 'diagram'];

export const excalidrawInsertNodeTool: ToolDefinition = {
  name: NAME('excalidrawInsertNode'),
  displayName: 'Insert Drawing',
  toolReferenceName: 'excalidrawInsertNode',
  description:
    'Insert an Excalidraw drawing into the Lexical document, optionally with its contents. This is how you draw a diagram: give the elements you want and they are laid out as you place them, in scene coordinates where x grows right and y grows down. Give a shape an `id` and a later arrow can bind to it with `startId`/`endId`, so the arrow follows the shape when it moves. Put text on a shape with `label` rather than positioning a separate text element on top of it. Returns the new block_id — keep it, every other excalidraw tool needs it. Omit `elements` to insert an empty canvas for a person to draw on themselves.',
  parameters: zodToToolParameters(excalidrawInsertNodeParamsSchema),
  operation: 'excalidrawInsertNode',
  config: {
    confirmationMessage: (params: { elements?: unknown[] }) =>
      `Insert a drawing of ${params.elements?.length ?? 0} element(s)?`,
    invocationMessage: () => 'Drawing in the lexical document',
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },
  tags: [...TAGS, 'insert'],
};

export const excalidrawListDrawingsTool: ToolDefinition = {
  name: NAME('excalidrawListDrawings'),
  displayName: 'List Drawings',
  toolReferenceName: 'excalidrawListDrawings',
  description:
    'List the Excalidraw drawings in the open Lexical document, with the block_id of each and a one-line description of what it holds. Call this first when asked to change "the diagram" and you do not already know its block_id.',
  parameters: zodToToolParameters(excalidrawListDrawingsParamsSchema),
  operation: 'excalidrawListDrawings',
  config: { ...QUIET, invocationMessage: () => 'Looking for drawings' },
  tags: [...TAGS, 'read'],
};

export const excalidrawReadSceneTool: ToolDefinition = {
  name: NAME('excalidrawReadScene'),
  displayName: 'Read Drawing',
  toolReferenceName: 'excalidrawReadScene',
  description:
    "Read what is inside one drawing: every element with its id, type, position, size and text. The element ids are the only way to address a shape, so read the scene before updating, deleting or connecting anything. The default 'summary' detail is what you want; 'full' returns the raw Excalidraw elements and is large.",
  parameters: zodToToolParameters(excalidrawReadSceneParamsSchema),
  operation: 'excalidrawReadScene',
  config: { ...QUIET, invocationMessage: () => 'Reading the drawing' },
  tags: [...TAGS, 'read'],
};

export const excalidrawAddElementsTool: ToolDefinition = {
  name: NAME('excalidrawAddElements'),
  displayName: 'Add to Drawing',
  toolReferenceName: 'excalidrawAddElements',
  description:
    'Add elements to a drawing that already exists, leaving what is there alone. Same element format as excalidrawInsertNode. To attach a new arrow to a shape already in the drawing, pass that shape\'s existing element id as `startId` or `endId`. Read the scene first if you need to know where there is room.',
  parameters: zodToToolParameters(excalidrawAddElementsParamsSchema),
  operation: 'excalidrawAddElements',
  config: {
    ...QUIET,
    invocationMessage: () => 'Adding to the drawing',
    priority: 'high',
  },
  tags: [...TAGS, 'edit'],
};

export const excalidrawUpdateElementsTool: ToolDefinition = {
  name: NAME('excalidrawUpdateElements'),
  displayName: 'Update Drawing Elements',
  toolReferenceName: 'excalidrawUpdateElements',
  description:
    'Change elements already in a drawing — move them, resize them, recolour them, or rewrite their text. Address each one by the element id from excalidrawReadScene. Fields you leave out are kept as they are. Setting `text` on a shape rewrites the label bound inside it rather than replacing the shape.',
  parameters: zodToToolParameters(excalidrawUpdateElementsParamsSchema),
  operation: 'excalidrawUpdateElements',
  config: { ...QUIET, invocationMessage: () => 'Changing the drawing' },
  tags: [...TAGS, 'edit'],
};

export const excalidrawDeleteElementsTool: ToolDefinition = {
  name: NAME('excalidrawDeleteElements'),
  displayName: 'Delete Drawing Elements',
  toolReferenceName: 'excalidrawDeleteElements',
  description:
    'Remove elements from a drawing by their element ids. Deleting a shape also removes the text bound inside it and detaches any arrows that pointed at it, so the drawing stays consistent.',
  parameters: zodToToolParameters(excalidrawDeleteElementsParamsSchema),
  operation: 'excalidrawDeleteElements',
  config: {
    confirmationMessage: (params: { elementIds?: string[] }) =>
      `Delete ${params.elementIds?.length ?? 0} element(s) from the drawing?`,
    invocationMessage: () => 'Removing from the drawing',
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'medium',
  },
  tags: [...TAGS, 'edit', 'delete'],
};

export const excalidrawConnectElementsTool: ToolDefinition = {
  name: NAME('excalidrawConnectElements'),
  displayName: 'Connect Drawing Elements',
  toolReferenceName: 'excalidrawConnectElements',
  description:
    'Draw an arrow from one element to another and bind it to both, so it follows them when either moves. Excalidraw works out where the arrow should meet each shape. Use this rather than adding an arrow with hand-computed points whenever both ends are existing shapes.',
  parameters: zodToToolParameters(excalidrawConnectElementsParamsSchema),
  operation: 'excalidrawConnectElements',
  config: { ...QUIET, invocationMessage: () => 'Connecting two shapes' },
  tags: [...TAGS, 'edit'],
};

export const excalidrawSetAppStateTool: ToolDefinition = {
  name: NAME('excalidrawSetAppState'),
  displayName: 'Set Drawing Canvas',
  toolReferenceName: 'excalidrawSetAppState',
  description:
    'Set the canvas behind a drawing: its background colour and its grid. This is about the canvas, not the shapes on it — use excalidrawUpdateElements to recolour a shape.',
  parameters: zodToToolParameters(excalidrawSetAppStateParamsSchema),
  operation: 'excalidrawSetAppState',
  config: { ...QUIET, invocationMessage: () => 'Setting up the canvas' },
  tags: [...TAGS, 'edit'],
};

export const excalidrawResizeTool: ToolDefinition = {
  name: NAME('excalidrawResize'),
  displayName: 'Resize Drawing',
  toolReferenceName: 'excalidrawResize',
  description:
    'Set how large the drawing is rendered in the document. This scales the picture on the page; it does not move or resize anything inside it. Omit width and height to go back to sizing by content.',
  parameters: zodToToolParameters(excalidrawResizeParamsSchema),
  operation: 'excalidrawResize',
  config: { ...QUIET, invocationMessage: () => 'Resizing the drawing' },
  tags: [...TAGS, 'edit'],
};

export const excalidrawClearSceneTool: ToolDefinition = {
  name: NAME('excalidrawClearScene'),
  displayName: 'Clear Drawing',
  toolReferenceName: 'excalidrawClearScene',
  description:
    'Empty a drawing, keeping the block so it can be drawn into again. To remove the drawing from the document altogether, use deleteBlocks with its block_id.',
  parameters: zodToToolParameters(excalidrawClearSceneParamsSchema),
  operation: 'excalidrawClearScene',
  config: {
    confirmationMessage: () => 'Empty this drawing?',
    invocationMessage: () => 'Emptying the drawing',
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'low',
  },
  tags: [...TAGS, 'edit', 'delete'],
};

export const excalidrawFromMermaidTool: ToolDefinition = {
  name: NAME('excalidrawFromMermaid'),
  displayName: 'Draw from Mermaid',
  toolReferenceName: 'excalidrawFromMermaid',
  description:
    'Turn Mermaid source into a real Excalidraw drawing — shapes and arrows that can then be moved, recoloured and edited like anything else you drew. This is the fastest way to produce a flowchart, sequence diagram or class diagram: write the Mermaid and let the layout be worked out for you, rather than placing boxes by hand. Give blockId to replace an existing drawing, or afterId to insert a new one.',
  parameters: zodToToolParameters(excalidrawFromMermaidParamsSchema),
  operation: 'excalidrawFromMermaid',
  config: {
    confirmationMessage: (params: { blockId?: string }) =>
      params.blockId
        ? 'Replace this drawing with the Mermaid diagram?'
        : 'Insert the Mermaid diagram as a drawing?',
    invocationMessage: () => 'Drawing the Mermaid diagram',
    requiresConfirmation: true,
    canBeReferencedInPrompt: true,
    priority: 'high',
  },
  tags: [...TAGS, 'insert', 'mermaid'],
};

/**
 * Every Excalidraw tool, in the order a reader meets them: make one, find
 * one, read one, change one.
 */
export const excalidrawToolDefinitions: ToolDefinition[] = [
  excalidrawInsertNodeTool,
  excalidrawFromMermaidTool,
  excalidrawListDrawingsTool,
  excalidrawReadSceneTool,
  excalidrawAddElementsTool,
  excalidrawUpdateElementsTool,
  excalidrawConnectElementsTool,
  excalidrawDeleteElementsTool,
  excalidrawSetAppStateTool,
  excalidrawResizeTool,
  excalidrawClearSceneTool,
];
