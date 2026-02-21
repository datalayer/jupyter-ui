/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  $isLineBreakNode,
  EditorConfig,
  EditorThemeClasses,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
  TextNode,
} from 'lexical';

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

import {
  addClassNamesToElement,
  removeClassNamesFromElement,
} from '@lexical/utils';

export const DEFAULT_CODE_LANGUAGE = 'python';

type SerializedCodeHighlightNode = Spread<
  {
    highlightType: string | null | undefined;
    type: 'jupyter-input-highlight';
    version: 1;
  },
  SerializedTextNode
>;

export const CODE_LANGUAGE_FRIENDLY_NAME_MAP: Record<string, string> = {
  c: 'C',
  clike: 'C-like',
  css: 'CSS',
  html: 'HTML',
  js: 'JavaScript',
  markdown: 'Markdown',
  objc: 'Objective-C',
  plain: 'Plain Text',
  py: 'Python',
  rust: 'Rust',
  sql: 'SQL',
  swift: 'Swift',
  xml: 'XML',
};

export const CODE_LANGUAGE_MAP: Record<string, string> = {
  javascript: 'js',
  md: 'markdown',
  plaintext: 'plain',
  python: 'py',
  text: 'plain',
};

export function normalizeCodeLang(lang: string) {
  return CODE_LANGUAGE_MAP[lang] || lang;
}

export function getLanguageFriendlyName(lang: string) {
  const _lang = normalizeCodeLang(lang);
  return CODE_LANGUAGE_FRIENDLY_NAME_MAP[_lang] || _lang;
}

export const getDefaultCodeLanguage = (): string => DEFAULT_CODE_LANGUAGE;

export const getCodeLanguages = (): Array<string> =>
  Object.keys(Prism.languages)
    .filter(
      // Prism has several language helpers mixed into languages object
      // so filtering them out here to get langs list
      language => typeof Prism.languages[language] !== 'function',
    )
    .sort();

/** @noInheritDoc */
export class JupyterInputHighlightNode extends TextNode {
  /** @internal */
  __highlightType: string | null | undefined;

  constructor(
    text: string,
    highlightType?: string | null | undefined,
    key?: NodeKey,
  ) {
    super(text, key);
    this.__highlightType = highlightType;
  }

  static getType(): string {
    return 'jupyter-input-highlight';
  }

  static clone(node: JupyterInputHighlightNode): JupyterInputHighlightNode {
    return new JupyterInputHighlightNode(
      node.__text,
      node.__highlightType || undefined,
      node.__key,
    );
  }

  getHighlightType(): string | null | undefined {
    const self = this.getLatest();
    return self.__highlightType;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    const className = getHighlightThemeClass(
      config.theme,
      this.__highlightType,
    );
    addClassNamesToElement(element, className);
    // Add Prism-compatible token classes so theme CSS (prism.css) can style spans
    if (this.__highlightType) {
      element.classList.add('token', this.__highlightType);
    }
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const update = super.updateDOM(prevNode, dom, config);
    const prevClassName = getHighlightThemeClass(
      config.theme,
      prevNode.__highlightType,
    );
    const nextClassName = getHighlightThemeClass(
      config.theme,
      this.__highlightType,
    );
    if (prevClassName !== nextClassName) {
      if (prevClassName) {
        removeClassNamesFromElement(dom, prevClassName);
      }
      if (nextClassName) {
        addClassNamesToElement(dom, nextClassName);
      }
    }
    if (prevNode.__highlightType !== this.__highlightType) {
      if (prevNode.__highlightType) {
        dom.classList.remove('token', prevNode.__highlightType);
      }
      if (this.__highlightType) {
        dom.classList.add('token', this.__highlightType);
      } else {
        dom.classList.remove('token');
      }
    }
    return update;
  }

  static importJSON(
    serializedNode: SerializedCodeHighlightNode,
  ): JupyterInputHighlightNode {
    const node = $createJupyterInputHighlightNode(
      serializedNode.text,
      serializedNode.highlightType,
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  exportJSON(): SerializedCodeHighlightNode {
    return {
      ...super.exportJSON(),
      highlightType: this.getHighlightType(),
      type: 'jupyter-input-highlight',
      version: 1,
    };
  }

  // Prevent formatting (bold, underline, etc)
  setFormat(format: number): this {
    return this;
  }
}

function getHighlightThemeClass(
  theme: EditorThemeClasses,
  highlightType: string | null | undefined,
): string | null | undefined {
  return (
    highlightType &&
    theme &&
    theme.codeHighlight &&
    theme.codeHighlight[highlightType]
  );
}

export function $createJupyterInputHighlightNode(
  text: string,
  highlightType?: string | null | undefined,
): JupyterInputHighlightNode {
  return new JupyterInputHighlightNode(text, highlightType);
}

export function $isJupyterInputHighlightNode(
  node: LexicalNode | JupyterInputHighlightNode | null | undefined,
): node is JupyterInputHighlightNode {
  return node instanceof JupyterInputHighlightNode;
}

export function getFirstJupyterInputHighlightNodeOfLine(
  anchor: LexicalNode,
): JupyterInputHighlightNode | null | undefined {
  let currentNode = null;
  const previousSiblings = anchor.getPreviousSiblings();
  previousSiblings.push(anchor);
  while (previousSiblings.length > 0) {
    const node = previousSiblings.pop();
    if ($isJupyterInputHighlightNode(node)) {
      currentNode = node;
    }
    if ($isLineBreakNode(node)) {
      break;
    }
  }

  return currentNode;
}

export function getLastJupyterInputHighlightNodeOfLine(
  anchor: LexicalNode,
): JupyterInputHighlightNode | null | undefined {
  let currentNode = null;
  const nextSiblings = anchor.getNextSiblings();
  nextSiblings.unshift(anchor);
  while (nextSiblings.length > 0) {
    const node = nextSiblings.shift();
    if ($isJupyterInputHighlightNode(node)) {
      currentNode = node;
    }
    if ($isLineBreakNode(node)) {
      break;
    }
  }

  return currentNode;
}
