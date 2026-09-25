/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Drawing, for people and for agents.
 *
 * The plugin has always done one thing: answer `INSERT_EXCALIDRAW_COMMAND` by
 * opening the modal, so somebody can draw. It now does a second: while it is
 * mounted, it contributes the Excalidraw tools to the document it belongs to,
 * and withdraws them when it unmounts.
 *
 * That is deliberate rather than incidental. An agent's tool list is the
 * whole of what it believes the editor can do, and an editor that never
 * registered `ExcalidrawNode` cannot draw — so advertising `excalidrawAddElements`
 * there costs a wasted call and produces a failure that reads like a bug.
 * Registering from inside the plugin makes the tool list follow the editor's
 * actual composition, without anybody having to keep a second list in step.
 *
 * @module plugins/excalidraw/ExcalidrawPlugin
 */

import type { JSX } from 'react';
import type { LexicalCommand } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import { Suspense, lazy, useEffect, useState } from 'react';

import type { ExcalidrawInitialElements } from '../../components/ExcalidrawModal';
import {
  $createExcalidrawNode,
  ExcalidrawNode,
} from '../../nodes/ExcalidrawNode';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import { $wrapNodeInElement } from '@lexical/utils';
import { $createParagraphNode } from 'lexical';

import { useOptionalLexicalConfig } from '../../context/LexicalConfigContext';
import { lexicalStore } from '../../state/LexicalState';
import { excalidrawPluginTools } from './tools';

/*
 * The drawing editor, fetched when someone inserts a drawing.
 *
 * Excalidraw is about 260 KiB compressed, and this plugin is mounted in every
 * editor through `ExcalidrawExtension`: a static import put it in the first
 * download of any page with a document, whether or not a drawing was ever
 * inserted. The node already loads its own component lazily; this was the
 * other door.
 */
const ExcalidrawModal = lazy(() => import('../../components/ExcalidrawModal'));

export const INSERT_EXCALIDRAW_COMMAND: LexicalCommand<void> = createCommand();

export function ExcalidrawPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isModalOpen, setModalOpen] = useState<boolean>(false);
  const config = useOptionalLexicalConfig();
  const lexicalId = config?.lexicalId;

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

  /*
   * The tools exist for exactly as long as this plugin does.
   *
   * Without a `lexicalId` there is no document for an agent to address, so
   * there is nothing to register against — an editor mounted for reading, or
   * one of the examples, rather than a mistake.
   */
  useEffect(() => {
    if (!lexicalId) {
      return;
    }
    lexicalStore
      .getState()
      .registerPluginTools(lexicalId, excalidrawPluginTools);
    return () => {
      lexicalStore
        .getState()
        .unregisterPluginTools(lexicalId, excalidrawPluginTools.name);
    };
  }, [lexicalId]);

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
    <Suspense fallback={null}>
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
    </Suspense>
  ) : null;
}
