/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What each Excalidraw tool takes.
 *
 * The element shape here is Excalidraw's own "skeleton" — the reduced form
 * `convertToExcalidrawElements` accepts, where a rectangle is `{type, x, y,
 * width, height}` rather than the thirty-field record the scene stores. That
 * is deliberate: the skeleton is the only part of the drawing format that is
 * meant to be written by hand, and everything it leaves out (seeds, version
 * nonces, fractional indices, binding geometry) is exactly what a model
 * should not be inventing.
 *
 * @module plugins/excalidraw/schemas
 */

import { z } from 'zod';

/** Colours, arrowheads and so on are Excalidraw's own vocabulary. */
const colorSchema = z
  .string()
  .describe("CSS colour, e.g. '#1e1e1e', '#e03131', 'transparent'");

/**
 * A shape, as written rather than as stored.
 *
 * Kept deliberately close to Excalidraw's skeleton type: the fields a
 * diagram actually needs, with everything derived left to the converter.
 */
export const elementSkeletonSchema = z.object({
  type: z
    .enum(['rectangle', 'ellipse', 'diamond', 'text', 'arrow', 'line', 'frame'])
    .describe('What to draw'),
  x: z.number().describe('Left edge, in scene coordinates'),
  y: z.number().describe('Top edge, in scene coordinates'),
  width: z.number().optional().describe('Width in pixels (shapes only)'),
  height: z.number().optional().describe('Height in pixels (shapes only)'),
  id: z
    .string()
    .optional()
    .describe(
      'Your own id for this element, so a later arrow can point at it by name. Any string; Excalidraw keeps it.',
    ),
  text: z.string().optional().describe("The text itself, for type 'text'"),
  label: z
    .string()
    .optional()
    .describe(
      'Text to put inside the shape. Excalidraw binds it to the shape, so moving the shape moves the label.',
    ),
  fontSize: z
    .number()
    .optional()
    .describe('Font size in pixels, e.g. 16, 20, 28'),
  strokeColor: colorSchema.optional().describe('Outline colour'),
  backgroundColor: colorSchema.optional().describe('Fill colour'),
  fillStyle: z
    .enum(['hachure', 'cross-hatch', 'solid'])
    .optional()
    .describe('How the fill is drawn'),
  strokeWidth: z.number().optional().describe('Outline thickness, 1 | 2 | 4'),
  strokeStyle: z
    .enum(['solid', 'dashed', 'dotted'])
    .optional()
    .describe('Outline style'),
  roughness: z
    .number()
    .optional()
    .describe('0 for architect (clean), 1 for artist, 2 for cartoonist'),
  opacity: z.number().optional().describe('0-100'),
  angle: z.number().optional().describe('Rotation in radians'),
  startId: z
    .string()
    .optional()
    .describe(
      "For 'arrow' and 'line': the id of the element the arrow starts at. The arrow stays attached when either element moves.",
    ),
  endId: z
    .string()
    .optional()
    .describe(
      "For 'arrow' and 'line': the id of the element the arrow points at.",
    ),
  points: z
    .array(z.array(z.number()))
    .optional()
    .describe(
      "For 'arrow' and 'line' without bindings: points relative to x,y, e.g. [[0,0],[120,0]]",
    ),
  children: z
    .array(z.string())
    .optional()
    .describe("For 'frame': the ids of the elements it contains"),
  name: z.string().optional().describe("For 'frame': its name"),
});

export type ElementSkeleton = z.infer<typeof elementSkeletonSchema>;

/** Where a new block goes, in the same vocabulary `insertBlock` uses. */
const afterIdSchema = z
  .string()
  .describe(
    "Where to put the drawing: 'TOP' for the beginning of the document, 'BOTTOM' for the end, or the block_id to insert after",
  );

/** Which drawing a call is about. */
const blockIdSchema = z
  .string()
  .describe(
    'The block_id of the drawing, from excalidrawListDrawings or readAllBlocks',
  );

export const excalidrawInsertNodeParamsSchema = z.object({
  afterId: afterIdSchema,
  elements: z
    .array(elementSkeletonSchema)
    .optional()
    .describe(
      'The drawing itself. Omit to insert an empty canvas for a person to draw on.',
    ),
  width: z
    .number()
    .optional()
    .describe('Rendered width in pixels. Omit to size to the content.'),
  height: z
    .number()
    .optional()
    .describe('Rendered height in pixels. Omit to size to the content.'),
});

export const excalidrawListDrawingsParamsSchema = z.object({});

export const excalidrawReadSceneParamsSchema = z.object({
  blockId: blockIdSchema,
  detail: z
    .enum(['summary', 'full'])
    .optional()
    .describe(
      "'summary' (default) gives each element's id, type, position, size and text — enough to change it. 'full' gives the raw Excalidraw elements, which is large; ask for it only when you need a field the summary omits.",
    ),
});

export const excalidrawAddElementsParamsSchema = z.object({
  blockId: blockIdSchema,
  elements: z
    .array(elementSkeletonSchema)
    .describe('The elements to add. Existing elements are left alone.'),
});

export const excalidrawUpdateElementsParamsSchema = z.object({
  blockId: blockIdSchema,
  updates: z
    .array(
      z.object({
        id: z.string().describe('The element id, from excalidrawReadScene'),
        x: z.number().optional(),
        y: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        text: z
          .string()
          .optional()
          .describe(
            "New text. On a shape this rewrites the label bound inside it; on a 'text' element it rewrites the element.",
          ),
        strokeColor: colorSchema.optional(),
        backgroundColor: colorSchema.optional(),
        fillStyle: z.enum(['hachure', 'cross-hatch', 'solid']).optional(),
        strokeWidth: z.number().optional(),
        strokeStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
        opacity: z.number().optional().describe('0-100'),
        angle: z.number().optional().describe('Rotation in radians'),
      }),
    )
    .describe('One entry per element to change. Fields left out are kept.'),
});

export const excalidrawDeleteElementsParamsSchema = z.object({
  blockId: blockIdSchema,
  elementIds: z
    .array(z.string())
    .describe('The ids to remove, from excalidrawReadScene'),
});

export const excalidrawConnectElementsParamsSchema = z.object({
  blockId: blockIdSchema,
  fromId: z.string().describe('The element the arrow starts at'),
  toId: z.string().describe('The element the arrow points at'),
  label: z
    .string()
    .optional()
    .describe('Text to sit on the arrow, e.g. "yes", "then"'),
  strokeColor: colorSchema.optional(),
  strokeStyle: z.enum(['solid', 'dashed', 'dotted']).optional(),
});

export const excalidrawSetAppStateParamsSchema = z.object({
  blockId: blockIdSchema,
  viewBackgroundColor: colorSchema
    .optional()
    .describe('The canvas colour behind the drawing'),
  gridSize: z
    .number()
    .optional()
    .describe('Grid spacing in pixels. 0 turns the grid off.'),
});

export const excalidrawResizeParamsSchema = z.object({
  blockId: blockIdSchema,
  width: z
    .number()
    .optional()
    .describe(
      'Rendered width in pixels. Omit to go back to sizing by content.',
    ),
  height: z
    .number()
    .optional()
    .describe(
      'Rendered height in pixels. Omit to go back to sizing by content.',
    ),
});

export const excalidrawClearSceneParamsSchema = z.object({
  blockId: blockIdSchema,
});

export const excalidrawFromMermaidParamsSchema = z.object({
  blockId: blockIdSchema
    .optional()
    .describe(
      'The drawing to replace. Omit to insert a new drawing instead, positioned by afterId.',
    ),
  afterId: afterIdSchema
    .optional()
    .describe(
      "Where a new drawing goes: 'TOP', 'BOTTOM', or a block_id. Ignored when blockId is given.",
    ),
  mermaid: z
    .string()
    .describe(
      'Mermaid source. Flowcharts, sequence diagrams and class diagrams convert to real shapes; anything else comes across as an image.',
    ),
  fontSize: z
    .number()
    .optional()
    .describe('Font size for the generated text, in pixels'),
});

export type ExcalidrawInsertNodeParams = z.infer<
  typeof excalidrawInsertNodeParamsSchema
>;
export type ExcalidrawListDrawingsParams = z.infer<
  typeof excalidrawListDrawingsParamsSchema
>;
export type ExcalidrawReadSceneParams = z.infer<
  typeof excalidrawReadSceneParamsSchema
>;
export type ExcalidrawAddElementsParams = z.infer<
  typeof excalidrawAddElementsParamsSchema
>;
export type ExcalidrawUpdateElementsParams = z.infer<
  typeof excalidrawUpdateElementsParamsSchema
>;
export type ExcalidrawDeleteElementsParams = z.infer<
  typeof excalidrawDeleteElementsParamsSchema
>;
export type ExcalidrawConnectElementsParams = z.infer<
  typeof excalidrawConnectElementsParamsSchema
>;
export type ExcalidrawSetAppStateParams = z.infer<
  typeof excalidrawSetAppStateParamsSchema
>;
export type ExcalidrawResizeParams = z.infer<
  typeof excalidrawResizeParamsSchema
>;
export type ExcalidrawClearSceneParams = z.infer<
  typeof excalidrawClearSceneParamsSchema
>;
export type ExcalidrawFromMermaidParams = z.infer<
  typeof excalidrawFromMermaidParamsSchema
>;
