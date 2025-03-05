/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {useState} from 'react';
import {
  $getNearestNodeFromDOMNode,
  $getSelection,
  $setSelection,
  LexicalEditor,
} from 'lexical';
import {$isJupyterCodeNode} from '../nodes/JupyterCodeNode';
import {useDebounce} from '../utils/debouncer';

interface Props {
  editor: LexicalEditor;
  getCodeDOMNode: () => HTMLElement | null;
}

export function CopyButton({editor, getCodeDOMNode}: Props) {
  const [isCopyCompleted, setCopyCompleted] = useState<boolean>(false);
  const removeSuccessIcon = useDebounce(() => {
    setCopyCompleted(false);
  }, 1000);
  async function handleClick(): Promise<void> {
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    let content = '';
    editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
      if (codeNode && $isJupyterCodeNode(codeNode)) {
        content = codeNode!.getTextContent();
      }
      const selection = $getSelection();
      $setSelection(selection);
    });
    try {
      await navigator.clipboard.writeText(content);
      setCopyCompleted(true);
      removeSuccessIcon();
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }
  return (
    <button className="menu-item" onClick={handleClick} aria-label="copy">
      {isCopyCompleted ? (
        <i className="format success" />
      ) : (
        <i className="format copy" />
      )}
    </button>
  );
}
