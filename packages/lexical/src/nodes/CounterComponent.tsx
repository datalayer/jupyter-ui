/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  $getNodeByKey,
  $getState,
  $setState,
  type LexicalEditor,
  type NodeKey,
} from 'lexical';
import { CounterNode } from './CounterNode';
import { counterValueState } from './counterState';

export function CounterComponent({
  editor,
  nodeKey,
}: {
  editor: LexicalEditor;
  nodeKey: NodeKey;
}) {
  const [value, setValue] = useState<number>(0);

  // On mount, sync with NodeState or node property
  useEffect(() => {
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey) as CounterNode | null;
      if (!node) return;

      // Prefer NodeState if present
      const stateVal = $getState(node, counterValueState);
      const initial = typeof stateVal === 'number' ? stateVal : node.getCount();
      setValue(initial);
    });
  }, [editor, nodeKey]);

  const update = useCallback(
    (delta: number) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey) as CounterNode | null;
        if (!node) return;
        const currentState = $getState(node, counterValueState);
        const current =
          typeof currentState === 'number' ? currentState : node.getCount();
        const next = current + delta;
        node.setCount(next);
        $setState(node, counterValueState, next);
        setValue(next);
      });
    },
    [editor, nodeKey],
  );

  const reset = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey) as CounterNode | null;
      if (!node) return;
      node.setCount(0);
      $setState(node, counterValueState, 0);
      setValue(0);
    });
  }, [editor, nodeKey]);

  const styles = useMemo(
    () => ({
      wrapper: { display: 'flex', alignItems: 'center', gap: '8px' },
      label: {
        fontFamily: 'monospace',
        fontWeight: 700,
        padding: '2px 6px',
        background: 'var(--bgColor-default)',
        border: '1px solid var(--borderColor-default)',
        borderRadius: '4px',
      },
      minus: {
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid var(--borderColor-danger-emphasis)',
        background: 'var(--bgColor-danger-muted)',
        color: 'var(--fgColor-danger)',
        fontWeight: 'bold',
        cursor: 'pointer',
      },
      plus: {
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid var(--borderColor-success-emphasis)',
        background: 'var(--bgColor-success-muted)',
        color: 'var(--fgColor-success)',
        fontWeight: 'bold',
        cursor: 'pointer',
      },
      reset: {
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid var(--borderColor-default)',
        background: 'var(--bgColor-muted)',
        color: 'var(--fgColor-default)',
        cursor: 'pointer',
      },
    }),
    [],
  );

  return (
    <div style={styles.wrapper as React.CSSProperties}>
      <button
        type="button"
        style={styles.minus as React.CSSProperties}
        onClick={() => update(-1)}
      >
        -
      </button>
      <span style={styles.label as React.CSSProperties}>Counter: {value}</span>
      <button
        type="button"
        style={styles.plus as React.CSSProperties}
        onClick={() => update(+1)}
      >
        +
      </button>
      <button
        type="button"
        style={styles.reset as React.CSSProperties}
        onClick={reset}
      >
        R
      </button>
    </div>
  );
}
