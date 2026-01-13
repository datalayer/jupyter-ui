/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

import type { LexicalCommand } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { useEffect, useState } from 'react';

import ExcalidrawModal from '../components/ExcalidrawModal';
import type { ExcalidrawInitialElements } from '../components/ExcalidrawModal';
import { $createExcalidrawNode, ExcalidrawNode } from '../nodes/ExcalidrawNode';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import { $wrapNodeInElement } from '@lexical/utils';
import { $createParagraphNode } from 'lexical';

export const INSERT_EXCALIDRAW_COMMAND: LexicalCommand<void> = createCommand();

export function ExcalidrawPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!editor.hasNodes([ExcalidrawNode])) {
      throw new Error('ExcalidrawPlugin: ExcalidrawNode not registered');
    }

    return editor.registerCommand(
      INSERT_EXCALIDRAW_COMMAND,
      () => {
        setModalOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  const onSave = (
    elements: ExcalidrawInitialElements,
    appState: Partial<AppState>,
    files: BinaryFiles,
  ) => {
    editor.update(() => {
      const excalidrawNode = $createExcalidrawNode();
      excalidrawNode.setData(
        JSON.stringify({
          elements,
          appState,
          files,
        }),
      );
      $insertNodes([excalidrawNode]);
      if ($isRootOrShadowRoot(excalidrawNode.getParentOrThrow())) {
        $wrapNodeInElement(excalidrawNode, $createParagraphNode).selectEnd();
      }
    });
    setModalOpen(false);
  };

  const onDelete = () => {
    setModalOpen(false);
  };

  const onClose = () => {
    setModalOpen(false);
  };

  return isModalOpen ? (
    <ExcalidrawModal
      initialElements={[]}
      initialAppState={{} as AppState}
      initialFiles={{}}
      isShown={isModalOpen}
      onSave={onSave}
      onDelete={onDelete}
      onClose={onClose}
      closeOnClickOutside={false}
    />
  ) : null;
}
