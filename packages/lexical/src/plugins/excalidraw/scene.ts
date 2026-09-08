/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The drawing inside an `ExcalidrawNode`, read and written as data.
 *
 * The node stores its whole scene as one JSON string. Nothing else in the
 * editor looks inside it: the component parses it to render, the modal parses
 * it to edit, and that was the only way in. The tools need a third way — read
 * it, change part of it, write it back — so the parsing lives here once,
 * rather than three times with three sets of assumptions.
 *
 * **Two shapes, one reader.** A node created by the toolbar starts life as
 * the string `'[]'`, and a node saved from the modal holds
 * `{elements, appState, files}`. Both are found in real documents, so both
 * are read here and only the second is ever written.
 *
 * Nothing in this module imports Excalidraw or Lexical: it is arithmetic on
 * plain objects, which is what lets the tool operations that summarise a
 * scene run outside a browser.
 *
 * @module plugins/excalidraw/scene
 */

/** An Excalidraw element, as it sits in the scene's JSON. */
export type ExcalidrawElementData = Record<string, any>;

/**
 * A whole drawing: what is in it, how the canvas is set up, and any images it
 * embeds.
 */
export interface ExcalidrawScene {
  elements: ExcalidrawElementData[];
  appState: Record<string, any>;
  files: Record<string, any>;
}

/** An empty drawing. */
export const emptyScene = (): ExcalidrawScene => ({
  elements: [],
  appState: {},
  files: {},
});

/**
 * Read a node's `data` string.
 *
 * Tolerant on purpose: a drawing that cannot be parsed reads as an empty one
 * rather than throwing, because the alternative is a tool call that fails on
 * a document the editor itself opens quite happily.
 */
export function parseScene(data: string | undefined | null): ExcalidrawScene {
  if (!data) {
    return emptyScene();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return emptyScene();
  }
  // The legacy shape: the elements array on its own.
  if (Array.isArray(parsed)) {
    return { elements: parsed as ExcalidrawElementData[], appState: {}, files: {} };
  }
  if (!parsed || typeof parsed !== 'object') {
    return emptyScene();
  }
  const scene = parsed as Partial<ExcalidrawScene>;
  return {
    elements: Array.isArray(scene.elements) ? scene.elements : [],
    appState: (scene.appState as Record<string, any>) ?? {},
    files: (scene.files as Record<string, any>) ?? {},
  };
}

/** Write a scene back to the string the node stores. */
export function serializeScene(scene: ExcalidrawScene): string {
  return JSON.stringify({
    elements: scene.elements,
    appState: scene.appState,
    files: scene.files,
  });
}

/** The elements that are actually on the canvas. */
export const liveElements = (
  scene: ExcalidrawScene,
): ExcalidrawElementData[] => scene.elements.filter(element => !element?.isDeleted);

/**
 * One element, reduced to what somebody deciding what to do next needs.
 *
 * A raw Excalidraw element carries about thirty fields, most of them about
 * how it is drawn rather than what it is — seeds, version nonces, fractional
 * indices, roughness. Handing all of that to a model for every element buries
 * the two things it actually needs, which are the id it can address the
 * element by and where the element sits.
 */
export interface ExcalidrawElementSummary {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** The element's own text, or the text bound inside it. */
  text?: string;
  strokeColor?: string;
  backgroundColor?: string;
  /** For bound text: the element it sits inside. */
  containerId?: string;
  /** For arrows: what they are attached to. */
  startBoundElementId?: string;
  endBoundElementId?: string;
  /** Groups the element belongs to, if any. */
  groupIds?: string[];
}

/** Reduce one element to its summary. */
export function summarizeElement(
  element: ExcalidrawElementData,
): ExcalidrawElementSummary {
  const summary: ExcalidrawElementSummary = {
    id: String(element?.id ?? ''),
    type: String(element?.type ?? 'unknown'),
    x: Number(element?.x ?? 0),
    y: Number(element?.y ?? 0),
    width: Number(element?.width ?? 0),
    height: Number(element?.height ?? 0),
  };
  if (typeof element?.text === 'string' && element.text.length > 0) {
    summary.text = element.text;
  }
  if (element?.strokeColor) {
    summary.strokeColor = String(element.strokeColor);
  }
  if (element?.backgroundColor) {
    summary.backgroundColor = String(element.backgroundColor);
  }
  if (element?.containerId) {
    summary.containerId = String(element.containerId);
  }
  if (element?.startBinding?.elementId) {
    summary.startBoundElementId = String(element.startBinding.elementId);
  }
  if (element?.endBinding?.elementId) {
    summary.endBoundElementId = String(element.endBinding.elementId);
  }
  if (Array.isArray(element?.groupIds) && element.groupIds.length > 0) {
    summary.groupIds = element.groupIds.map(String);
  }
  return summary;
}

/**
 * The text a container shows, gathered from the element bound inside it.
 *
 * Excalidraw does not put a label on the shape; it makes a separate text
 * element whose `containerId` points back. Reading a rectangle on its own
 * therefore says nothing about what the rectangle is called, which is
 * usually the only thing worth knowing about it.
 */
export function withBoundText(
  elements: ExcalidrawElementData[],
): ExcalidrawElementSummary[] {
  const textByContainer = new Map<string, string>();
  for (const element of elements) {
    if (element?.type === 'text' && element?.containerId && element?.text) {
      textByContainer.set(String(element.containerId), String(element.text));
    }
  }
  return elements.map(element => {
    const summary = summarizeElement(element);
    if (summary.text === undefined) {
      const bound = textByContainer.get(summary.id);
      if (bound) {
        summary.text = bound;
      }
    }
    return summary;
  });
}

/**
 * A one-line description of a drawing, for a listing.
 *
 * What is in it and what it says — "3 rectangles, 2 arrows: Start, Finish" —
 * which is enough to pick the right drawing out of a document holding
 * several.
 */
export function describeScene(scene: ExcalidrawScene): string {
  const elements = liveElements(scene);
  if (elements.length === 0) {
    return 'empty drawing';
  }
  const counts = new Map<string, number>();
  const labels: string[] = [];
  for (const element of elements) {
    const type = String(element?.type ?? 'unknown');
    if (type === 'text') {
      const text = String(element?.text ?? '').trim();
      if (text) {
        labels.push(text);
      }
      // Bound text is the container's label, not a shape of its own.
      if (element?.containerId) {
        continue;
      }
    }
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const shapes = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ');
  const said = labels.slice(0, 3).join(', ');
  return said ? `${shapes}: ${said}` : shapes;
}

/**
 * Stamp an element as changed.
 *
 * Excalidraw reconciles concurrent edits by comparing `version` and, when
 * those tie, `versionNonce`. An element written back with its old version is
 * an element a collaborating client is entitled to discard, so every
 * mutation goes through here.
 */
export function touchElement(
  element: ExcalidrawElementData,
): ExcalidrawElementData {
  return {
    ...element,
    version: Number(element?.version ?? 1) + 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    updated: Date.now(),
  };
}
