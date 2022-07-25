import { LexicalNode, $isElementNode, $isTextNode } from "lexical";
import { INotebookContent, ICodeCell, IMarkdownCell } from "@jupyterlab/nbformat";
import { $isEquationNode } from "./../nodes/EquationNode";
import { $isYouTubeNode } from "./../nodes/YouTubeNode";
import { $isJupyterCodeNode } from "./../nodes/JupyterCodeNode";
import { exportTopLevelElements } from "./markdown/MarkdownExport";
import { transformersByType } from './markdown/utils';
import { TRANSFORMERS } from './markdown/index';

export const lexicalToNbFormat = (nodes: LexicalNode[]) => {
  const nb: INotebookContent = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {},
    cells: []
  }
  nodes.map(node => {
    if ($isJupyterCodeNode(node)) {
      nb.cells.push(newCodeCell(node.getTextContent()));
    }
    else if ($isEquationNode(node)) {
      nb.cells.push(newMardownCell(node.getEquation()));
    }
    else if ($isYouTubeNode(node)) {
      const code = `from IPython.display import YouTubeVideo
YouTubeVideo('${node.getId()}')`
      nb.cells.push(newCodeCell(code));
    }
    else if ($isElementNode(node)) {
      const markdown = $convertToMarkdownString(node, TRANSFORMERS as any);
      nb.cells.push(newMardownCell(markdown));
    }
    else if ($isTextNode(node)) {
      const markdown = $convertToMarkdownString(node, TRANSFORMERS as any);
      nb.cells.push(newMardownCell(markdown));
    }
  });
  return nb;
}

const newCodeCell = (source: string): ICodeCell => {
  return {
    source,
    cell_type: 'code',
    metadata: {},
    outputs: [],
    execution_count: 0,
  }
}

const newMardownCell = (source: string): IMarkdownCell => {
  return {
    source,
    cell_type: 'markdown',
    metadata: {},
    outputs: [],
    execution_count: 0,
  }
}

function $convertToMarkdownString(
  node: LexicalNode,
  transformers: Array<Transformer>,
): string {
  const exportMarkdown = createMarkdownExport(node, transformers);
  return exportMarkdown();
}


function createMarkdownExport(
  node: LexicalNode,
  transformers: Array<Transformer>,
): () => string {
  const byType = transformersByType(transformers as any);
  // Export only uses text formats that are responsible for single format
  // e.g. it will filter out *** (bold, italic) and instead use separate ** and *
  const textFormatTransformers = byType.textFormat.filter(
    (transformer) => transformer.format.length === 1,
  );
  return () => {
    const output = [];
    const result = exportTopLevelElements(
      node,
      byType.element,
      textFormatTransformers,
      byType.textMatch,
    );
    if (result != null) {
      output.push(result);
    }
    return output.join('\n\n');
  };
}

export default lexicalToNbFormat;
