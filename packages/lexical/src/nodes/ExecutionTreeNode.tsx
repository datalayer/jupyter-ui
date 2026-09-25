/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The tree of an execution, in a document.
 *
 * A block on the root, like an embed: the root refuses inline decorators, so
 * `isInline()` is false, which `DecoratorBlockNode` already says. It stores the
 * execution's id and nothing more, because what it shows moves while the run
 * goes; the host draws it through `OrchestrationRenderersContext`. Nothing here
 * updates the editor, so no update ever starts from inside a listener.
 *
 * @module nodes/ExecutionTreeNode
 */

import type { JSX } from 'react';
import type {
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import { useOrchestrationRenderers } from '../context/OrchestrationRenderersContext';

export type SerializedExecutionTreeNode = Spread<
  {
    executionId: string;
    type: 'execution-tree';
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

type ExecutionTreeComponentProps = Readonly<{
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  executionId: string;
}>;

function ExecutionTreeComponent({
  className,
  format,
  nodeKey,
  executionId,
}: ExecutionTreeComponentProps): JSX.Element {
  const { renderExecutionTree } = useOrchestrationRenderers();
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      <div className="execution-tree" data-execution-tree={executionId}>
        {renderExecutionTree ? (
          renderExecutionTree({ executionId })
        ) : (
          <span>Execution {executionId}</span>
        )}
      </div>
    </BlockWithAlignableContents>
  );
}

export class ExecutionTreeNode extends DecoratorBlockNode {
  __executionId: string;

  static getType(): string {
    return 'execution-tree';
  }

  static clone(node: ExecutionTreeNode): ExecutionTreeNode {
    return new ExecutionTreeNode(node.__executionId, node.__format, node.__key);
  }

  static importJSON(
    serialized: SerializedExecutionTreeNode,
  ): ExecutionTreeNode {
    // `updateFromJSON` keeps the format and the `$` marks a document put on
    // the block; building from the id alone would drop them.
    return $createExecutionTreeNode(serialized.executionId).updateFromJSON(
      serialized,
    );
  }

  exportJSON(): SerializedExecutionTreeNode {
    return {
      ...super.exportJSON(),
      type: 'execution-tree',
      version: 1,
      executionId: this.__executionId,
    };
  }

  constructor(executionId: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__executionId = executionId;
  }

  updateDOM(): false {
    return false;
  }

  getExecutionId(): string {
    return this.getLatest().__executionId;
  }

  isTopLevel(): true {
    return true;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    return (
      <ExecutionTreeComponent
        className={{
          base: embedBlockTheme.base || '',
          focus: embedBlockTheme.focus || '',
        }}
        format={this.__format}
        nodeKey={this.getKey()}
        executionId={this.__executionId}
      />
    );
  }
}

export function $createExecutionTreeNode(
  executionId: string,
): ExecutionTreeNode {
  return new ExecutionTreeNode(executionId);
}

export function $isExecutionTreeNode(
  node: LexicalNode | null | undefined,
): node is ExecutionTreeNode {
  return node instanceof ExecutionTreeNode;
}
