/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lexical → nbformat.
 *
 * A code cell for every Jupyter input, carrying the outputs of the output
 * node that follows it; one Markdown cell for every run of anything else,
 * written with the package's Markdown transformers (tables, images,
 * equations and rules included) so that a notebook reads the way the
 * document does. A YouTube embed becomes the code that displays it.
 *
 * @module convert/LexicalToNbformat
 */

import { $isElementNode, $isParagraphNode, type LexicalNode } from 'lexical';
import type {
  ICell,
  ICodeCell,
  IMarkdownCell,
  INotebookContent,
  IOutput,
} from '@jupyterlab/nbformat';
import { $isEquationNode } from './../nodes/EquationNode';
import { $isYouTubeNode } from './../nodes/YouTubeNode';
import { $isLoomNode } from './../nodes/LoomNode';
import { loomEmbedUrl, loomVideoId } from './../utils/loom';
import { $isJupyterInputNode } from './../nodes/JupyterInputNode';
import { $isJupyterOutputNode } from './../nodes/JupyterOutputNode';
import { exportTopLevelElements } from './markdown/MarkdownExport';
import { transformersByType } from './markdown/utils';
import { PLAYGROUND_TRANSFORMERS } from './transformers/MarkdownTransformers';

/** The metadata of a notebook this converter writes: a Python 3 kernel. */
export const NBFORMAT_METADATA: INotebookContent['metadata'] = {
  kernelspec: {
    display_name: 'Python 3 (ipykernel)',
    language: 'python',
    name: 'python3',
  },
  language_info: {
    codemirror_mode: {
      name: 'ipython',
      version: 3,
    },
    file_extension: '.py',
    mimetype: 'text/x-python',
    name: 'python',
    nbconvert_exporter: 'python',
    pygments_lexer: 'ipython3',
    version: '3',
  },
};

/**
 * The notebook for the top-level `nodes` of a document, usually
 * `$getRoot().getChildren()` read inside `editor.getEditorState().read()`.
 */
export const lexicalToNbformat = (nodes: LexicalNode[]): INotebookContent => {
  const cells: ICell[] = [];
  let markdown: string[] = [];
  const nextId = () => `cell-${cells.length + 1}`;

  const flushMarkdown = () => {
    if (markdown.length > 0) {
      cells.push(newMarkdownCell(nextId(), markdown.join('\n\n')));
      markdown = [];
    }
  };

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if ($isJupyterInputNode(node)) {
      flushMarkdown();
      let outputs: IOutput[] = [];
      const next = nodes[index + 1];
      if (
        $isJupyterOutputNode(next) &&
        next.getJupyterInputNodeUuid() === node.getJupyterInputNodeUuid()
      ) {
        outputs = next.getOutputs();
        index++;
      }
      cells.push(newCodeCell(nextId(), node.getTextContent(), outputs));
    } else if ($isJupyterOutputNode(node)) {
      // An output whose input is gone has nothing to be the output of.
      continue;
    } else if ($isYouTubeNode(node)) {
      flushMarkdown();
      cells.push(
        newCodeCell(
          nextId(),
          `from IPython.display import YouTubeVideo\nYouTubeVideo('${node.getId()}')`,
          [],
        ),
      );
    } else if ($isLoomNode(node)) {
      const id = loomVideoId(node.getVideo().url);
      if (!id) {
        // A block still waiting for its video: nothing to show in a notebook.
        continue;
      }
      flushMarkdown();
      cells.push(
        newCodeCell(
          nextId(),
          `from IPython.display import IFrame\nIFrame('${loomEmbedUrl(id)}', width=800, height=450)`,
          [],
        ),
      );
    } else if (
      $isParagraphNode(node) &&
      node.getChildrenSize() === 1 &&
      $isEquationNode(node.getFirstChild())
    ) {
      const equation = node.getFirstChild();
      if ($isEquationNode(equation)) {
        markdown.push(`$$${equation.getEquation()}$$`);
      }
    } else {
      const text = $exportNodeToMarkdown(node);
      if (text !== null && text.trim() !== '') {
        markdown.push(text);
      }
    }
  }
  flushMarkdown();

  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: NBFORMAT_METADATA,
    cells,
  };
};

const newCodeCell = (
  id: string,
  source: string,
  outputs: IOutput[],
): ICodeCell => ({
  id,
  cell_type: 'code',
  metadata: {},
  source,
  outputs,
  execution_count: null,
});

const newMarkdownCell = (id: string, source: string): IMarkdownCell => ({
  id,
  cell_type: 'markdown',
  metadata: {},
  source,
});

const markdownByType = transformersByType(PLAYGROUND_TRANSFORMERS);
// Export uses the transformers responsible for a single format, so bold
// italic comes out as separate `**` and `*` rather than `***`.
const markdownTextFormats = markdownByType.textFormat.filter(
  transformer => transformer.format.length === 1,
);

/** One top-level node as Markdown, through the package's transformers. */
function $exportNodeToMarkdown(node: LexicalNode): string | null {
  if (!$isElementNode(node) && !$isYouTubeNode(node)) {
    // A decorator on its own (a rule, an image at the root) goes through the
    // element transformers too, which is what `exportTopLevelElements` does.
  }
  return exportTopLevelElements(
    node,
    markdownByType.element,
    markdownTextFormats,
    markdownByType.textMatch,
  );
}

export default lexicalToNbformat;
