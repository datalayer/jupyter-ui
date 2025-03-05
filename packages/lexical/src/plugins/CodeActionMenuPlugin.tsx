/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {$getNearestNodeFromDOMNode} from 'lexical';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import { $isJupyterCodeNode, JupyterCodeNode } from '../nodes/JupyterCodeNode';
import { 
  getLanguageFriendlyName,
//  normalizeCodeLang,
} from '../nodes/JupyterCodeHighlightNode';
import {CopyButton} from '../components/CopyButton';
// import {canBePrettier, PrettierButton} from '../components/PrettierButton';
import {useDebounce} from '../utils/debouncer';

import './../../style/lexical/CodeActionMenuPlugin.css';

const CODE_PADDING = 0;

interface Position {
  top: string;
  right: string;
}

function CodeActionMenuContainer({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [lang, setLang] = useState('');
  const [isShown, setShown] = useState<boolean>(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] =
    useState<boolean>(false);
  const [position, setPosition] = useState<Position>({
    right: '0',
    top: '0',
  });
  const codeSetRef = useRef<Set<string>>(new Set());
  const codeDOMNodeRef = useRef<HTMLElement | null>(null);
  function getCodeDOMNode(): HTMLElement | null {
    return codeDOMNodeRef.current;
  }
  const debouncedOnMouseMove = useDebounce(
    (event: MouseEvent) => {
      const {codeDOMNode, isOutside} = getMouseInfo(event);
      if (isOutside) {
        setShown(false);
        return;
      }
      if (!codeDOMNode) {
        return;
      }
      codeDOMNodeRef.current = codeDOMNode;
      let codeNode: JupyterCodeNode | null = null;
      let _lang = '';
      editor.update(() => {
        const maybeCodeNode = $getNearestNodeFromDOMNode(codeDOMNode);
        if (maybeCodeNode && $isJupyterCodeNode(maybeCodeNode)) {
          codeNode = maybeCodeNode as JupyterCodeNode;
          _lang = codeNode.getLanguage() || '';
        }
      });
      if (codeNode) {
        const {y: editorElemY, right: editorElemRight} =
          anchorElem.getBoundingClientRect();
        const {y, right} = codeDOMNode.getBoundingClientRect();
        setLang(_lang);
        setShown(true);
        setPosition({
          right: `${editorElemRight - right + CODE_PADDING}px`,
          top: `${y - editorElemY + 10}px`,
        });
      }
    },
    50,
    1000,
  );
  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }
    document.addEventListener('mousemove', debouncedOnMouseMove);
    return () => {
      setShown(false);
      debouncedOnMouseMove.cancel();
      document.removeEventListener('mousemove', debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);

  editor.registerMutationListener(JupyterCodeNode, (mutations) => {
    editor.getEditorState().read(() => {
      for (const [key, type] of mutations) {
        switch (type) {
          case 'created':
            codeSetRef.current.add(key);
            setShouldListenMouseMove(codeSetRef.current.size > 0);
            break;
          case 'destroyed':
            codeSetRef.current.delete(key);
            setShouldListenMouseMove(codeSetRef.current.size > 0);
            break;
          default:
            break;
        }
      }
    });
  });
//  const normalizedLang = normalizeCodeLang(lang);
  const codeFriendlyName = getLanguageFriendlyName(lang);
  return (
    <>
      {isShown ? (
        <div className="code-action-menu-container" style={{...position}}>
          <div className="code-highlight-language">{codeFriendlyName}</div>
          <CopyButton editor={editor} getCodeDOMNode={getCodeDOMNode} />
          {/*
          {canBePrettier(normalizedLang) ? (
            <PrettierButton
              editor={editor}
              getCodeDOMNode={getCodeDOMNode}
              lang={normalizedLang}
            />
          ) : null}
          */}
        </div>
      ) : null}
    </>
  );
}

function getMouseInfo(event: MouseEvent): {
  codeDOMNode: HTMLElement | null;
  isOutside: boolean;
} {
  const target = event.target;
  if (target && target instanceof HTMLElement) {
    const codeDOMNode = target.closest<HTMLElement>(
      'code.PlaygroundEditorTheme__code',
    );
    const isOutside = !(
      codeDOMNode ||
      target.closest<HTMLElement>('div.code-action-menu-container')
    );

    return {codeDOMNode, isOutside};
  } else {
    return {codeDOMNode: null, isOutside: true};
  }
}

export const CodeActionMenuPlugin = ({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): React.ReactPortal | null => {
  return createPortal(
    <CodeActionMenuContainer anchorElem={anchorElem} />,
    anchorElem,
  );
}

export default CodeActionMenuPlugin;
