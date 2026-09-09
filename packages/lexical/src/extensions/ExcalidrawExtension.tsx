/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Excalidraw drawings, as a Lexical extension.
 *
 * Registers `ExcalidrawNode` and mounts `ExcalidrawPlugin` — the insert
 * command, the drawing modal, and the drawing tools an agent gets when the
 * editor has a `lexicalId` — as a decorator of the React extension.
 *
 * @module extensions/ExcalidrawExtension
 */

import { ReactExtension } from '@lexical/react/ReactExtension';
import { configExtension, defineExtension } from 'lexical';
import { ExcalidrawNode } from '../nodes/ExcalidrawNode';
import { ExcalidrawPlugin } from '../plugins/excalidraw/ExcalidrawPlugin';

export const ExcalidrawExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/Excalidraw',
  nodes: () => [ExcalidrawNode],
  dependencies: [
    configExtension(ReactExtension, { decorators: [<ExcalidrawPlugin />] }),
  ],
});
