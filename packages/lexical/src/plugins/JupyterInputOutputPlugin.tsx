/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useCallback, useRef } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  createCommand,
  NodeKey,
  COMMAND_PRIORITY_EDITOR,
  INSERT_LINE_BREAK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_CRITICAL,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createLineBreakNode,
  $createRangeSelection,
  LexicalNode,
  $getNodeByKey,
  $createNodeSelection,
  $setSelection,
  SELECT_ALL_COMMAND,
  $getRoot,
  $isElementNode,
  $nodesOfType,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  OutputAdapter,
  newUuid,
  Kernel,
  OnSessionConnection,
  type JupyterVariant,
} from '@datalayer/jupyter-react';
import { UUID } from '@lumino/coreutils';
import { IOutput } from '@jupyterlab/nbformat';
import type { IOutputAreaModel } from '@jupyterlab/outputarea';
import { Session } from '@jupyterlab/services';
import { createNoRuntimeWarning } from '../nodes/jupyterUtils';
import {
  $createJupyterInputNode,
  JupyterInputNode,
  $isJupyterInputNode,
} from '../nodes/JupyterInputNode';
import { $createJupyterInputHighlightNode } from '../nodes/JupyterInputHighlightNode';
import { registerCodeHighlighting } from '../nodes/JupyterInputHighlighter';
import {
  JupyterOutputNode,
  $createJupyterOutputNode,
  $isJupyterOutputNode,
} from '../nodes/JupyterOutputNode';
import { debugLog } from '../utils/debugLog';

type UUID = string;

export const INPUT_UUID_TO_OUTPUT_KEY = new Map<UUID, NodeKey | undefined>();
export const INPUT_UUID_TO_CODE_KEY = new Map<UUID, NodeKey | undefined>();
export const INPUT_UUID_TO_OUTPUT_UUID = new Map<UUID, UUID | undefined>();
export const OUTPUT_UUID_TO_CODE_UUID = new Map<UUID, UUID | undefined>();
export const OUTPUT_UUID_TO_OUTPUT_KEY = new Map<UUID, NodeKey | undefined>();

/**
 * The output node that belongs to an input, in the editor of the current
 * update — found by its uuid, never by key alone.
 *
 * The registries above map a uuid to a node key, and a node key means
 * something only within one editor. Two editors on one page (the loro
 * example's two panes) hold the same document with the same uuids; the
 * registry keeps the key of whichever editor registered last, and the other
 * editor's lookup lands on an unrelated node that happens to carry that key —
 * which it then "moves" beside its input, and the two editors correct each
 * other until React gives up. So a key is taken only when the node it names is
 * the right kind and carries the uuid; otherwise this editor's own nodes are
 * searched for it.
 */
export function $jupyterOutputNodeFor(
  inputUuid: string,
): JupyterOutputNode | null {
  const candidates = $nodesOfType(JupyterOutputNode).filter(
    candidate => candidate.getJupyterInputNodeUuid() === inputUuid,
  );
  if (candidates.length === 0) {
    return null;
  }
  // A document may hold two outputs for one input (an earlier version left
  // copies behind). They must not take turns at the input's side — every
  // move is a commit, and two of them correcting each other never end — so
  // the one already seated after its input is the input's output, always.
  const seated = candidates.find(candidate => {
    const before = candidate.getPreviousSibling();
    return (
      before !== null &&
      $isJupyterInputNode(before) &&
      before.getJupyterInputNodeUuid() === inputUuid
    );
  });
  if (seated) {
    return seated;
  }
  const key = INPUT_UUID_TO_OUTPUT_KEY.get(inputUuid);
  const byKey = key ? $getNodeByKey(key) : null;
  if (
    byKey &&
    $isJupyterOutputNode(byKey) &&
    byKey.getJupyterInputNodeUuid() === inputUuid
  ) {
    return byKey;
  }
  return candidates[0];
}

/** The input node with this uuid, in the editor of the current update. */
export function $jupyterInputNodeFor(
  inputUuid: string,
): JupyterInputNode | null {
  const key = INPUT_UUID_TO_CODE_KEY.get(inputUuid);
  const node = key ? $getNodeByKey(key) : null;
  if (
    node &&
    $isJupyterInputNode(node) &&
    node.getJupyterInputNodeUuid() === inputUuid
  ) {
    return node;
  }
  return (
    $nodesOfType(JupyterInputNode).find(
      candidate => candidate.getJupyterInputNodeUuid() === inputUuid,
    ) ?? null
  );
}

export const DEFAULT_INITIAL_OUTPUTS: IOutput[] = [
  {
    output_type: 'execute_result',
    data: {
      'text/html': [
        '<div style="color: #888; font-size: 11px; font-style: italic; padding: 0; margin: 0;">',
        'Press <kbd style="font-size: 10px; padding: 1px 4px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 3px;">Shift+Enter</kbd> to execute.',
        '</div>',
      ],
    },
    execution_count: 0,
    metadata: {},
  },
];

export type JupyterInputOutputProps = {
  code: string;
  outputs?: IOutput[];
  loading?: string;
  /** `marimo` for a reactive cell; unset means the kernel's own variant. */
  variant?: JupyterVariant;
};

export type JupyterInputOutputPluginProps = {
  kernel?: Kernel;
  /**
   * Callback on session connection changed.
   */
  onSessionConnection?: OnSessionConnection;
};

export const INSERT_JUPYTER_INPUT_OUTPUT_COMMAND =
  createCommand<JupyterInputOutputProps>();

/**
 * Command to execute the currently focused/selected Jupyter cell.
 * Dispatching this command will execute the code in the cell where the cursor is located.
 */
export const RUN_JUPYTER_CELL_COMMAND = createCommand<void>();

/**
 * Command to execute all Jupyter cells in the document.
 * Dispatching this command will execute all cells in sequential order.
 */
export const RUN_ALL_JUPYTER_CELLS_COMMAND = createCommand<void>();

/**
 * Command to restart the Jupyter kernel.
 * Dispatching this command will restart the kernel session.
 */
export const RESTART_JUPYTER_KERNEL_COMMAND = createCommand<void>();

/**
 * Command to clear all outputs from all Jupyter cells in the document.
 * Dispatching this command will clear the outputs of all cells without affecting the code.
 */
export const CLEAR_ALL_OUTPUTS_COMMAND = createCommand<void>();

export const JupyterInputOutputPlugin = (
  props?: JupyterInputOutputPluginProps,
) => {
  const { kernel, onSessionConnection } = props || {};
  const [editor] = useLexicalComposerContext();
  const isUpdatingKernels = useRef(false);
  const isMovingNodes = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Function to update all existing output nodes with the current kernel
  // CRITICAL: Must run even when kernel is undefined (runtime terminated)!
  const updateAllOutputNodesWithKernel = useCallback(() => {
    if (isUpdatingKernels.current) return;

    isUpdatingKernels.current = true;

    // Defer editor.update to next microtask to avoid flushSync warning
    // This ensures React's render phase completes before we update the editor
    queueMicrotask(() => {
      if (!isMountedRef.current || editor.getRootElement() == null) {
        isUpdatingKernels.current = false;
        return;
      }

      editor.update(
        () => {
          // Replaced editor states can temporarily leave selection points
          // referencing removed nodes. Clear invalid range selections so this
          // maintenance update does not throw Point.getNode errors.
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = $getNodeByKey(selection.anchor.key);
            const focusNode = $getNodeByKey(selection.focus.key);
            if (!anchorNode || !focusNode) {
              $setSelection(null);
            }
          }

          editor.getEditorState()._nodeMap.forEach(node => {
            if (node instanceof JupyterOutputNode) {
              // Update the kernel for this output node (even if undefined!)
              node.updateKernel(kernel);
            }
          });
        },
        { discrete: true },
      ); // Use discrete to prevent triggering update listeners
      isUpdatingKernels.current = false;
    });
  }, [kernel, editor]);

  // Update output nodes when kernel changes (including when it becomes undefined!)
  useEffect(() => {
    updateAllOutputNodesWithKernel();
  }, [kernel, updateAllOutputNodesWithKernel]);

  // Restore mutation listeners with proper recursion protection
  useEffect(() => {
    return editor.registerMutationListener(
      JupyterInputNode,
      (mutatedNodes: Map<NodeKey, any>, { prevEditorState }) => {
        // Skip if we're already moving nodes to prevent recursion
        if (isMovingNodes.current) return;

        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'destroyed') {
            // Mutation listeners run in the middle of a commit; starting a
            // new update from here recurses into nested commits on lexical
            // 0.49 (stack overflow, then reconciler recovery remounting
            // every decorator). Defer off the commit stack first.
            queueMicrotask(() =>
              editor.update(
                () => {
                  // The destroyed input is gone from this state; the one
                  // before still has it, uuid and all. (The registry maps
                  // keys of every editor on the page; a key is not enough.)
                  const jupyterInputNodeUuid = prevEditorState.read(() => {
                    const node = $getNodeByKey(nodeKey);
                    return node && $isJupyterInputNode(node)
                      ? node.getJupyterInputNodeUuid()
                      : undefined;
                  });
                  const jupyterOutputNodeUuid = jupyterInputNodeUuid
                    ? INPUT_UUID_TO_OUTPUT_UUID.get(jupyterInputNodeUuid)
                    : undefined;

                  if (jupyterInputNodeUuid && jupyterOutputNodeUuid) {
                    // Remove the corresponding output node
                    const outputNode =
                      $jupyterOutputNodeFor(jupyterInputNodeUuid);
                    if (outputNode) {
                      outputNode.markDirty();
                      outputNode.removeForce();
                    }

                    // Clean up all map entries
                    INPUT_UUID_TO_CODE_KEY.delete(jupyterInputNodeUuid);
                    INPUT_UUID_TO_OUTPUT_KEY.delete(jupyterInputNodeUuid);
                    INPUT_UUID_TO_OUTPUT_UUID.delete(jupyterInputNodeUuid);
                    OUTPUT_UUID_TO_CODE_UUID.delete(jupyterOutputNodeUuid);
                    OUTPUT_UUID_TO_OUTPUT_KEY.delete(jupyterOutputNodeUuid);
                  }
                },
                { discrete: true },
              ),
            );
          } else if (mutation === 'updated') {
            // Only move nodes if they're actually out of position — and off
            // the commit stack, for the same reason as above.
            queueMicrotask(() =>
              editor.update(
                () => {
                  const inputNode = $getNodeByKey(nodeKey);
                  if (inputNode && $isJupyterInputNode(inputNode)) {
                    const inputUuid = inputNode.getJupyterInputNodeUuid();
                    const outputNode = $jupyterOutputNodeFor(inputUuid);

                    if (outputNode) {
                      const inputNextSibling = inputNode.getNextSibling();

                      // Only move if the output node is not immediately after the input node
                      if (inputNextSibling !== outputNode) {
                        isMovingNodes.current = true;
                        try {
                          outputNode.remove(false);
                          inputNode.insertAfter(outputNode);
                        } finally {
                          isMovingNodes.current = false;
                        }
                      }
                    }
                  }
                },
                { discrete: true },
              ),
            );
          }
        }
      },
    );
  }, [editor]);

  // Output node mutation listener to keep outputs with their inputs
  useEffect(() => {
    return editor.registerMutationListener(
      JupyterOutputNode,
      (mutatedNodes: Map<NodeKey, any>) => {
        // Skip if we're already moving nodes to prevent recursion
        if (isMovingNodes.current) return;

        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'updated') {
            // Off the commit stack, as in the input-node listener above.
            queueMicrotask(() =>
              editor.update(
                () => {
                  const node = $getNodeByKey(nodeKey);
                  if (node && $isJupyterOutputNode(node)) {
                    const outputNode = node;
                    const inputUuid = outputNode.getJupyterInputNodeUuid();
                    const inputNode = $jupyterInputNodeFor(inputUuid);
                    // A copy of the input's output stays where it is; only
                    // the input's output sits beside it.
                    if (
                      inputNode &&
                      $jupyterOutputNodeFor(inputUuid) === outputNode
                    ) {
                      const inputNextSibling = inputNode.getNextSibling();

                      // Only move if this output node is not immediately after its input node
                      if (inputNextSibling !== outputNode) {
                        isMovingNodes.current = true;
                        try {
                          outputNode.remove(false);
                          inputNode.insertAfter(outputNode);
                        } finally {
                          isMovingNodes.current = false;
                        }
                      }
                    }
                  }
                },
                { discrete: true },
              ),
            );
          }
        }
      },
    );
  }, [editor]);

  // Listen for session changes and call onSessionConnection callback
  useEffect(() => {
    if (!onSessionConnection) return;

    // Call the callback with the current session when kernel becomes available or changes
    // Initial call
    if (kernel) {
      onSessionConnection(kernel.session);
      if (kernel.session) {
        kernel.session.statusChanged.connect(
          (sessionConnection: Session.ISessionConnection, _status: string) => {
            onSessionConnection(sessionConnection);
          },
        );
        kernel.session.connectionStatusChanged.connect(
          (
            sessionConnection: Session.ISessionConnection,
            _connectionStatus: string,
          ) => {
            onSessionConnection(sessionConnection);
          },
        );
      }
    } else {
      // Call with undefined when no kernel is available
      onSessionConnection(undefined);
    }
  }, [kernel, kernel?.session, onSessionConnection]);

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);
  useEffect(() => {
    if (!editor.hasNodes([JupyterOutputNode])) {
      throw new Error(
        'JupyterInputOutputPlugin: JupyterOutputNode not registered on editor',
      );
    }
    if (!editor.hasNodes([JupyterInputNode])) {
      throw new Error(
        'JupyterInputOutputPlugin: JupyterInputNode not registered on editor',
      );
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand<boolean>(
      INSERT_LINE_BREAK_COMMAND,
      _event => {
        const selection = $getSelection();
        const node = selection?.getNodes()[0];
        if (node?.__parent) {
          const parentNode = $getNodeByKey(node?.__parent);
          if (parentNode && $isJupyterInputNode(parentNode)) {
            // Allow normal Enter for line breaks in JupyterInputNode
            // Execution will be handled by KEY_ENTER_COMMAND with Shift modifier
            return false;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH, // Changed to HIGH so it can handle line breaks
    );
  }, [editor]);

  // Handle Enter key - distinguish between Enter and Shift+Enter
  useEffect(() => {
    return editor.registerCommand<KeyboardEvent | null>(
      KEY_ENTER_COMMAND,
      event => {
        // Lexical 0.49 types this command's payload as nullable. The browser
        // always supplies the event, and with none there is no modifier key to
        // read, so decline the command rather than guess at Shift.
        if (!event) {
          return false;
        }
        const selection = $getSelection();
        const node = selection?.getNodes()[0];
        if (node?.__parent) {
          const parentNode = $getNodeByKey(node?.__parent);
          if (parentNode && $isJupyterInputNode(parentNode)) {
            if (event.shiftKey) {
              // Shift+Enter: Execute code
              event.preventDefault();
              const code = parentNode.getTextContent();
              const jupyterInputNodeUuid = (
                parentNode as JupyterInputNode
              ).getJupyterInputNodeUuid();

              const existingOutputNode =
                $jupyterOutputNodeFor(jupyterInputNodeUuid);

              {
                if (existingOutputNode) {
                  // Check the existing output node's adapter kernel
                  const existingAdapter = existingOutputNode.__outputAdapter;

                  // Get writable node ONCE at the start
                  const writableNode =
                    existingOutputNode.getWritable() as JupyterOutputNode;

                  // Update kernel if needed
                  // Always sync the adapter's kernel to the current kernel
                  // prop. Otherwise a cell that previously executed on the
                  // browser (Pyodide) kernel would keep that stale kernel even
                  // after a remote runtime is assigned.
                  if (existingAdapter.kernel !== kernel) {
                    existingAdapter.kernel = kernel;
                  }

                  // Set the code
                  writableNode.__code = code;

                  // Handle execution
                  if (!existingAdapter.kernel) {
                    // Show user-facing warning
                    const warningOutput = createNoRuntimeWarning();
                    // Update BOTH the node's outputs AND the adapter's model
                    writableNode.__outputs = [warningOutput];
                    existingAdapter.setOutputs([warningOutput]);
                    writableNode.__renderTrigger++;
                  } else {
                    existingAdapter.execute(code);
                  }

                  return true;
                }
              }
              // Create new output node
              const outputAdapter = new OutputAdapter(newUuid(), kernel, []);
              const jupyterOutputNode = $createJupyterOutputNode(
                code,
                outputAdapter,
                [],
                true,
                jupyterInputNodeUuid,
                UUID.uuid4(),
              );

              // Insert the output node immediately after the input node
              parentNode.insertAfter(jupyterOutputNode);
              const nodeSelection = $createNodeSelection();
              nodeSelection.add(parentNode.__key);
              $setSelection(nodeSelection);
              return true;
            }
            // Regular Enter: Insert a line break directly
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const lineBreak = $createLineBreakNode();
              selection.insertNodes([lineBreak]);
              event.preventDefault();
              return true;
            }
            return false;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW, // Changed to LOW so INSERT_LINE_BREAK_COMMAND can handle regular Enter
    );
  }, [editor, kernel]);

  // Handle Ctrl+A to select all content within a Jupyter input cell
  // Use CRITICAL priority to run before Lexical's internal select-all handler
  useEffect(() => {
    return editor.registerCommand<KeyboardEvent>(
      SELECT_ALL_COMMAND,
      (event: KeyboardEvent) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        // Traverse up from current node to find parent JupyterInputNode
        let currentNode: LexicalNode | null = selection.anchor.getNode();
        let jupyterInputNode: JupyterInputNode | null = null;
        let depth = 0;
        const maxDepth = 20;

        while (currentNode && depth < maxDepth) {
          if ($isJupyterInputNode(currentNode)) {
            jupyterInputNode = currentNode as JupyterInputNode;
            break;
          }

          currentNode = currentNode.getParent();
          depth++;
        }

        if (jupyterInputNode) {
          event.preventDefault();
          event.stopPropagation();

          // Check if entire cell is already selected by looking at the selection range
          const isCollapsed = selection.isCollapsed();
          const cellKey = jupyterInputNode.getKey();
          const cellSize = jupyterInputNode.getChildrenSize();

          // Selection is considered "entire cell" if it spans from offset 0 to childrenSize
          // We need to check if selection covers the full range, regardless of anchor/focus order
          let selectionCoversEntireCell = false;

          if (!isCollapsed) {
            // Get the anchor and focus nodes
            const anchorNode = selection.anchor.getNode();
            const focusNode = selection.focus.getNode();

            // Check if both anchor and focus are within or at the jupyter input node
            const anchorInCell =
              anchorNode.getKey() === cellKey ||
              anchorNode.getParent()?.getKey() === cellKey;
            const focusInCell =
              focusNode.getKey() === cellKey ||
              focusNode.getParent()?.getKey() === cellKey;

            if (anchorInCell && focusInCell) {
              // Get text content to check if entire cell is selected
              const selectedText = selection.getTextContent();
              const cellText = jupyterInputNode.getTextContent();
              selectionCoversEntireCell = selectedText === cellText;
            }
          }

          console.warn('[SELECT_ALL] Check:', {
            isCollapsed,
            selectionCoversEntireCell,
            selectedText: selection.getTextContent().substring(0, 50),
            cellText: jupyterInputNode.getTextContent().substring(0, 50),
          });

          if (selectionCoversEntireCell) {
            // Second Cmd+A: Select ENTIRE document
            console.warn(
              '[SELECT_ALL] Second press - selecting entire document',
            );
            const root = $getRoot();
            const rangeSelection = $createRangeSelection();
            rangeSelection.anchor.set(root.getKey(), 0, 'element');
            rangeSelection.focus.set(
              root.getKey(),
              root.getChildrenSize(),
              'element',
            );
            $setSelection(rangeSelection);
            return true;
          } else {
            // First Cmd+A: Select all content within current cell
            console.warn('[SELECT_ALL] First press - selecting current cell');
            const rangeSelection = $createRangeSelection();
            rangeSelection.anchor.set(jupyterInputNode.getKey(), 0, 'element');
            rangeSelection.focus.set(
              jupyterInputNode.getKey(),
              cellSize,
              'element',
            );
            $setSelection(rangeSelection);
            return true;
          }
        }

        return false; // Allow default select-all if not in Jupyter cell
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_JUPYTER_INPUT_OUTPUT_COMMAND,
      (props: JupyterInputOutputProps) => {
        debugLog(
          '[JupyterInputOutputPlugin] 🔵 INSERT_JUPYTER_INPUT_OUTPUT_COMMAND triggered',
        );
        debugLog('[JupyterInputOutputPlugin] Props:', props);

        const { code, outputs, variant } = props;
        const selection = $getSelection();

        debugLog('[JupyterInputOutputPlugin] Selection exists?', !!selection);
        debugLog(
          '[JupyterInputOutputPlugin] Is RangeSelection?',
          $isRangeSelection(selection),
        );

        if ($isRangeSelection(selection)) {
          // Don't remove text - marker was already removed and selection is collapsed

          // Create the input node
          const jupyterCodeNode = $createJupyterInputNode('python');
          const jupyterCodeUuid = jupyterCodeNode.getJupyterInputNodeUuid();

          debugLog('[JupyterInputOutputPlugin] ✅ Created JupyterInputNode');
          debugLog('[JupyterInputOutputPlugin] Node UUID:', jupyterCodeUuid);
          debugLog(
            '[JupyterInputOutputPlugin] Node type:',
            jupyterCodeNode.getType(),
          );
          debugLog(
            '[JupyterInputOutputPlugin] Node children before append:',
            jupyterCodeNode.getChildrenSize(),
          );

          // Add code content BEFORE inserting the node
          if (code) {
            debugLog(
              '[JupyterInputOutputPlugin] 📝 Code provided, length:',
              code.length,
            );
            debugLog(
              '[JupyterInputOutputPlugin] Code content:',
              code.substring(0, 100),
            );

            // Create a JupyterInputHighlightNode with the code text
            const codeNode = $createJupyterInputHighlightNode(code);
            debugLog(
              '[JupyterInputOutputPlugin] ✅ Created JupyterInputHighlightNode',
            );
            debugLog(
              '[JupyterInputOutputPlugin] CodeNode type:',
              codeNode.getType(),
            );
            debugLog(
              '[JupyterInputOutputPlugin] CodeNode text length:',
              codeNode.getTextContent().length,
            );

            jupyterCodeNode.append(codeNode);
            debugLog(
              '[JupyterInputOutputPlugin] ✅ Appended code to JupyterInputNode',
            );
            debugLog(
              '[JupyterInputOutputPlugin] Node children after append:',
              jupyterCodeNode.getChildrenSize(),
            );
            debugLog(
              '[JupyterInputOutputPlugin] Node text content:',
              jupyterCodeNode.getTextContent(),
            );
          } else {
            debugLog('[JupyterInputOutputPlugin] ⚠️ No code provided');
          }

          debugLog(
            '[JupyterInputOutputPlugin] 🚀 Inserting node into document...',
          );
          debugLog('[JupyterInputOutputPlugin] Selection before insert:', {
            anchorKey: selection.anchor.key,
            anchorOffset: selection.anchor.offset,
            focusKey: selection.focus.key,
            focusOffset: selection.focus.offset,
          });

          // Now insert the complete node with its content
          selection.insertNodes([jupyterCodeNode]);

          debugLog('[JupyterInputOutputPlugin] ✅ Node inserted');
          debugLog(
            '[JupyterInputOutputPlugin] Node key after insert:',
            jupyterCodeNode.getKey(),
          );
          debugLog(
            '[JupyterInputOutputPlugin] Node parent:',
            jupyterCodeNode.getParent()?.getType(),
          );

          // Create the output node with kernel (may be undefined - that's OK!)
          debugLog('[JupyterInputOutputPlugin] 📤 Creating output node...');
          debugLog('[JupyterInputOutputPlugin] Kernel available?', !!kernel);
          debugLog('[JupyterInputOutputPlugin] Outputs:', outputs);

          const outputAdapter = new OutputAdapter(
            newUuid(),
            kernel,
            outputs,
            undefined,
            false,
            variant,
          );
          const jupyterOutputNode = $createJupyterOutputNode(
            code,
            outputAdapter,
            outputs || [],
            true,
            jupyterCodeUuid,
            UUID.uuid4(),
            variant,
          );

          debugLog('[JupyterInputOutputPlugin] ✅ Created JupyterOutputNode');
          debugLog(
            '[JupyterInputOutputPlugin] Output node type:',
            jupyterOutputNode.getType(),
          );

          const jupyterOutputNodeKey = jupyterOutputNode.getKey();
          outputAdapter.outputArea.model.changed.connect(
            (
              outputModel: IOutputAreaModel,
              _args: IOutputAreaModel.ChangedArgs,
            ) => {
              // The signal fires synchronously from wherever the model was
              // touched — a kernel IOPub message, a React passive effect, or
              // the middle of a Lexical commit. Since lexical 0.49 an update
              // started on such a stack is deferred into recursive commits
              // (stack overflow, then a corrupted key→DOM map and endless
              // decorator remounts), so hop off the current stack first.
              queueMicrotask(() => {
                const outputs = outputModel.toJSON();
                editor.update(
                  () => {
                    const node = $getNodeByKey(jupyterOutputNodeKey);
                    if (!(node instanceof JupyterOutputNode)) {
                      return;
                    }
                    const previous = node.getOutputs();
                    if (
                      previous.length !== outputs.length ||
                      JSON.stringify(previous) !== JSON.stringify(outputs)
                    ) {
                      node.setOutputs(outputs);
                    }
                    // The first model change proves the auto-run started;
                    // burn the flag so a decorator remount (view switch,
                    // reconciler recovery) re-renders the outputs instead of
                    // re-executing the code.
                    if (node.getAutoRun()) {
                      node.setAutoRun(false);
                    }
                  },
                  { discrete: true },
                ); // Use discrete to avoid cluttering undo stack
              });
            },
          );

          // Get the parent to insert the output node
          const parent = jupyterCodeNode.getParent();
          debugLog(
            '[JupyterInputOutputPlugin] Parent node:',
            parent?.getType(),
          );

          if (parent) {
            debugLog(
              '[JupyterInputOutputPlugin] 🚀 Inserting output node after input node...',
            );
            jupyterCodeNode.insertAfter(jupyterOutputNode);
            debugLog('[JupyterInputOutputPlugin] ✅ Output node inserted');
          } else {
            debugLog(
              '[JupyterInputOutputPlugin] ⚠️ No parent found, cannot insert output node',
            );
          }

          // Position cursor at the beginning of the jupyter-input node
          debugLog('[JupyterInputOutputPlugin] 📍 Positioning cursor...');
          jupyterCodeNode.selectStart();

          debugLog(
            '[JupyterInputOutputPlugin] 🎉 INSERT_JUPYTER_INPUT_OUTPUT_COMMAND completed successfully',
          );
        } else {
          debugLog(
            '[JupyterInputOutputPlugin] ❌ Selection is not a RangeSelection',
          );
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel]);

  /**
   * Helper function to execute code for a given input node.
   * Centralizes adapter/kernel setup and code execution logic.
   */
  const executeInputNode = useCallback(
    (node: JupyterInputNode, kernelToUse: Kernel) => {
      const code = node.getTextContent();
      const jupyterInputNodeUuid = node.getJupyterInputNodeUuid();
      const jupyterOutputNode = $jupyterOutputNodeFor(jupyterInputNodeUuid);
      if (jupyterOutputNode) {
        // Update kernel using public API before execution
        jupyterOutputNode.updateKernel(kernelToUse);
        jupyterOutputNode.executeCode(code);
        return true;
      }
      return false;
    },
    [],
  );

  // Handle RUN_JUPYTER_CELL_COMMAND - execute currently focused cell
  useEffect(() => {
    return editor.registerCommand(
      RUN_JUPYTER_CELL_COMMAND,
      () => {
        if (!kernel) {
          console.warn('❌ No kernel available for cell execution');
          return false;
        }

        const selection = $getSelection();
        if (!selection) return false;

        const nodes = selection.getNodes();
        const node = nodes[0];

        // Find parent JupyterInputNode using public API
        const parentNode = node?.getParent();
        if (parentNode && $isJupyterInputNode(parentNode)) {
          // Use shared helper to execute the cell
          return executeInputNode(parentNode, kernel);
        }
        return false;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel, executeInputNode]);

  // Handle RUN_ALL_JUPYTER_CELLS_COMMAND - execute all cells in document order
  useEffect(() => {
    return editor.registerCommand(
      RUN_ALL_JUPYTER_CELLS_COMMAND,
      () => {
        if (!kernel) {
          console.warn('❌ No kernel available for running all cells');
          return false;
        }

        // Collect all JupyterInputNodes in document order using public API
        const inputNodes: JupyterInputNode[] = [];

        function collectJupyterInputNodes(node: LexicalNode) {
          if ($isJupyterInputNode(node)) {
            inputNodes.push(node);
          }
          if ($isElementNode(node)) {
            const children = node.getChildren();
            for (const child of children) {
              collectJupyterInputNodes(child);
            }
          }
        }

        const root = $getRoot();
        collectJupyterInputNodes(root);

        if (inputNodes.length === 0) {
          console.warn('❌ No Jupyter cells found to execute');
          return false;
        }

        debugLog(`🚀 Executing ${inputNodes.length} cells in document order`);

        // Execute each cell in document order using shared helper
        inputNodes.forEach((node: JupyterInputNode) => {
          executeInputNode(node, kernel);
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel, executeInputNode]);

  // Handle RESTART_JUPYTER_KERNEL_COMMAND - restart the kernel
  useEffect(() => {
    return editor.registerCommand(
      RESTART_JUPYTER_KERNEL_COMMAND,
      () => {
        if (!kernel?.session?.kernel) {
          console.warn('❌ No kernel session available to restart');
          return false;
        }

        // Execute restart asynchronously without blocking
        (async () => {
          try {
            if (!kernel.session.kernel) {
              console.error('❌ Kernel became null during restart');
              return;
            }
            debugLog('🔄 Restarting kernel...');
            await kernel.session.kernel.restart();
            debugLog('✅ Kernel restarted successfully');
          } catch (error) {
            console.error('❌ Failed to restart kernel:', error);
          }
        })();

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor, kernel]);

  // Handle CLEAR_ALL_OUTPUTS_COMMAND - clear outputs from all cells
  useEffect(() => {
    return editor.registerCommand(
      CLEAR_ALL_OUTPUTS_COMMAND,
      () => {
        let clearedCount = 0;

        // Traverse document tree and clear all JupyterOutputNode outputs
        function clearJupyterOutputs(node: LexicalNode) {
          if (node instanceof JupyterOutputNode) {
            // Use outputAdapter.clear() to properly clear the OutputArea model
            if (node.__outputAdapter) {
              node.__outputAdapter.clear();
              clearedCount++;
            }
          }
          if ($isElementNode(node)) {
            const children = node.getChildren();
            for (const child of children) {
              clearJupyterOutputs(child);
            }
          }
        }

        const root = $getRoot();
        clearJupyterOutputs(root);

        if (clearedCount > 0) {
          debugLog(`✅ Cleared outputs from ${clearedCount} cells`);
        } else {
          console.warn('❌ No Jupyter cells found to clear');
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
};

export default JupyterInputOutputPlugin;
