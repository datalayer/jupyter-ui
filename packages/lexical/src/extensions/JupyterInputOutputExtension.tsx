/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Executable code with its outputs, as a Lexical extension.
 *
 * Registers `JupyterInputNode`, its highlight node and `JupyterOutputNode`.
 * The behaviour — running cells on a kernel, moving outputs with their
 * inputs, the run/restart/clear commands — is `JupyterInputOutputPlugin`,
 * which needs the kernel the host holds, so the extension exposes it as its
 * output component for the host to place:
 *
 * ```tsx
 * const JupyterInputOutput = useExtensionComponent(JupyterInputOutputExtension);
 * return <JupyterInputOutput kernel={kernel} />;
 * ```
 *
 * or `<ExtensionComponent lexical:extension={JupyterInputOutputExtension} kernel={kernel} />`.
 *
 * @module extensions/JupyterInputOutputExtension
 */

import { ReactExtension } from '@lexical/react/ReactExtension';
import { defineExtension } from 'lexical';
import { JupyterInputHighlightNode } from '../nodes/JupyterInputHighlightNode';
import { JupyterInputNode } from '../nodes/JupyterInputNode';
import { JupyterOutputNode } from '../nodes/JupyterOutputNode';
import { JupyterInputOutputPlugin } from '../plugins/JupyterInputOutputPlugin';

export const JupyterInputOutputExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/JupyterInputOutput',
  nodes: () => [JupyterInputNode, JupyterInputHighlightNode, JupyterOutputNode],
  dependencies: [ReactExtension],
  build: () => ({ Component: JupyterInputOutputPlugin }),
});
