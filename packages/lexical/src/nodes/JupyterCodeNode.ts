/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// eslint-disable-next-line simple-import-sort/imports
import type {
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  ParagraphNode,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from 'lexical';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  ElementNode,
} from 'lexical';
import {addClassNamesToElement} from '@lexical/utils';
import { UUID } from '@lumino/coreutils';
import type {JupyterCodeHighlightNode} from './JupyterCodeHighlightNode';
import { $createJupyterCodeHighlightNode, getFirstJupyterCodeHighlightNodeOfLine } from './JupyterCodeHighlightNode';
import { CODE_UUID_TO_CODE_KEY } from "../plugins/JupyterPlugin";

import * as Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';

type SerializedCodeNode = Spread<
  {
    language: string | null | undefined;
    type: 'jupyter-code';
    codeNodeUuid: string;
    version: 1;
  },
  SerializedElementNode
>;

const mapToPrismLanguage = (
  language: string | null | undefined,
): string | null | undefined => {
  // eslint-disable-next-line no-prototype-builtins
  return language != null && Prism.languages.hasOwnProperty(language)
    ? language
    : undefined;
};

const LANGUAGE_DATA_ATTRIBUTE = 'data-highlight-language';

export class JupyterCodeNode extends ElementNode {
  /** @internal */
  __language: string | null | undefined;

  __codeNodeUuid: string;

  static getType(): string {
    return 'jupyter-code';
  }

  static clone(node: JupyterCodeNode): JupyterCodeNode {
    return new JupyterCodeNode(node.__language, node.__codeNodeUuid, node.__key);
  }

  constructor(language?: string | null | undefined, codeNodeUuid? :string, key?: NodeKey) {
    super(key);
    this.__language = mapToPrismLanguage(language);
    this.__codeNodeUuid = codeNodeUuid || UUID.uuid4();
    CODE_UUID_TO_CODE_KEY.set(this.__codeNodeUuid, this.__key);
  }

  setCodeNodeUuid(codeNodeUuid: string) {
    const self = this.getWritable();
    self.__codeNodeUuid = codeNodeUuid;
  }

  getCodeNodeUuid(): string {
    const self = this.getLatest();
    return self.__codeNodeUuid;
  }

  // View
  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('code');
    addClassNamesToElement(element, config.theme.code);
    element.setAttribute('spellcheck', 'false');
    const language = this.getLanguage();
    if (language) {
      element.setAttribute(LANGUAGE_DATA_ATTRIBUTE, language);
    }
    return element;
  }

  updateDOM(prevNode: JupyterCodeNode, dom: HTMLElement): boolean {
    const language = this.__language;
    const prevLanguage = prevNode.__language;
    if (language) {
      if (language !== prevLanguage) {
        dom.setAttribute(LANGUAGE_DATA_ATTRIBUTE, language);
      }
    } else if (prevLanguage) {
      dom.removeAttribute(LANGUAGE_DATA_ATTRIBUTE);
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      // Typically <pre> is used for code blocks, and <code> for inline code styles
      // but if it's a multi line <code> we'll create a block. Pass through to
      // inline format handled by TextNode otherwise
      code: (node: Node) => {
        const isMultiLine =
          node.textContent != null && /\r?\n/.test(node.textContent);
        return isMultiLine
          ? {
              conversion: convertPreElement,
              priority: 1,
            }
          : null;
      },
      div: (node: Node) => ({
        conversion: convertDivElement,
        priority: 1,
      }),
      pre: (node: Node) => ({
        conversion: convertPreElement,
        priority: 0,
      }),
      table: (node: Node) => {
        const table = node;
        // domNode is a <table> since we matched it by nodeName
        if (isGitHubCodeTable(table as HTMLTableElement)) {
          return {
            conversion: convertTableElement,
            priority: 4,
          };
        }
        return null;
      },
      td: (node: Node) => {
        // element is a <td> since we matched it by nodeName
        const td = node as HTMLTableCellElement;
        const table: HTMLTableElement | null = td.closest('table');
        if (isGitHubCodeCell(td)) {
          return {
            conversion: convertTableCellElement,
            priority: 4,
          };
        }
        if (table && isGitHubCodeTable(table)) {
          // Return a no-op if it's a table cell in a code table, but not a code line.
          // Otherwise it'll fall back to the T
          return {
            conversion: convertCodeNoop,
            priority: 4,
          };
        }
        return null;
      },
      tr: (node: Node) => {
        // element is a <tr> since we matched it by nodeName
        const tr = node as HTMLTableCellElement;
        const table: HTMLTableElement | null = tr.closest('table');
        if (table && isGitHubCodeTable(table)) {
          return {
            conversion: convertCodeNoop,
            priority: 4,
          };
        }
        return null;
      },
    };
  }

  static importJSON(serializedNode: SerializedCodeNode): JupyterCodeNode {
    const node = $createJupyterCodeNode(serializedNode.language, serializedNode.codeNodeUuid);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedCodeNode {
    return {
      ...super.exportJSON(),
      type: 'jupyter-code',
      language: this.getLanguage(),
      codeNodeUuid: this.getCodeNodeUuid(),
      version: 1,
    };
  }

  // Mutation
  insertNewAfter(
    selection: RangeSelection,
  ): null | ParagraphNode | JupyterCodeHighlightNode {
    const children = this.getChildren();
    const childrenLength = children.length;
    if (
      childrenLength >= 2 &&
      children[childrenLength - 1].getTextContent() === '\n' &&
      children[childrenLength - 2].getTextContent() === '\n' &&
      selection.isCollapsed() &&
      selection.anchor.key === this.__key &&
      selection.anchor.offset === childrenLength
    ) {
      children[childrenLength - 1].remove();
      children[childrenLength - 2].remove();
      const newElement = $createParagraphNode();
      this.insertAfter(newElement);
      return newElement;
    }
    // If the selection is within the codeblock, find all leading tabs and
    // spaces of the current line. Create a new line that has all those
    // tabs and spaces, such that leading indentation is preserved.
    const anchor = selection.anchor.getNode();
    const firstNode = getFirstJupyterCodeHighlightNodeOfLine(anchor);
    if (firstNode != null) {
      let leadingWhitespace = 0;
      const firstNodeText = firstNode.getTextContent();
      while (
        leadingWhitespace < firstNodeText.length &&
        /[\t ]/.test(firstNodeText[leadingWhitespace])
      ) {
        leadingWhitespace += 1;
      }
      if (leadingWhitespace > 0) {
        const whitespace = firstNodeText.substring(0, leadingWhitespace);
        const indentedChild = $createJupyterCodeHighlightNode(whitespace);
        anchor.insertAfter(indentedChild);
        selection.insertNodes([$createLineBreakNode()]);
        indentedChild.select();
        return indentedChild;
      }
    }
    return null;
  }

  canInsertTab(): boolean {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
      return false;
    }
    return true;
  }

  canIndent(): false {
    return false;
  }

  collapseAtStart(): true {
    const paragraph = $createParagraphNode();
    const children = this.getChildren();
    children.forEach((child) => paragraph.append(child));
    this.replace(paragraph);
    return true;
  }

  setLanguage(language: string): void {
    const writable = this.getWritable();
    writable.__language = mapToPrismLanguage(language);
  }

  getLanguage(): string | null | undefined {
    return this.getLatest().__language;
  }
}

export function $createJupyterCodeNode(
  language?: string | null | undefined,
  codeNodeUuid?: string
): JupyterCodeNode {
  return new JupyterCodeNode(language, codeNodeUuid);
}

export function $isJupyterCodeNode(
  node: LexicalNode | null | undefined,
): node is JupyterCodeNode {
  return node instanceof JupyterCodeNode;
}

function convertPreElement(domNode: Node): DOMConversionOutput {
  return {node: $createJupyterCodeNode("python")};
}

function convertDivElement(domNode: Node): DOMConversionOutput {
  // domNode is a <div> since we matched it by nodeName
  const div = domNode as HTMLDivElement;
  return {
    after: (childLexicalNodes) => {
      const domParent = domNode.parentNode;
      if (domParent != null && domNode !== domParent.lastChild) {
        childLexicalNodes.push($createLineBreakNode());
      }
      return childLexicalNodes;
    },
    node: isCodeElement(div) ? $createJupyterCodeNode("python") : null,
  };
}

function convertTableElement(): DOMConversionOutput {
  return {node: $createJupyterCodeNode("python")};
}

function convertCodeNoop(): DOMConversionOutput {
  return {node: null};
}

function convertTableCellElement(domNode: Node): DOMConversionOutput {
  // domNode is a <td> since we matched it by nodeName
  const cell = domNode as HTMLTableCellElement;

  return {
    after: (childLexicalNodes) => {
      if (cell.parentNode && cell.parentNode.nextSibling) {
        // Append newline between code lines
        childLexicalNodes.push($createLineBreakNode());
      }
      return childLexicalNodes;
    },
    node: null,
  };
}

function isCodeElement(div: HTMLDivElement): boolean {
  return div.style.fontFamily.match('monospace') !== null;
}

function isGitHubCodeCell(
  cell: HTMLTableCellElement,
): cell is HTMLTableCellElement {
  return cell.classList.contains('js-file-line');
}

function isGitHubCodeTable(table: HTMLTableElement): table is HTMLTableElement {
  return table.classList.contains('js-file-line-container');
}
