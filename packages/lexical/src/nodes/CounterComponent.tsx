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
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '4px',
      },
      minus: {
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid #d32f2f',
        background: 'linear-gradient(90deg, #ffebee 60%, #ffcdd2 100%)',
        color: '#b71c1c',
        fontWeight: 'bold',
        boxShadow: '0 0 4px #d32f2f44',
        cursor: 'pointer',
      },
      plus: {
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid #388e3c',
        background: 'linear-gradient(90deg, #e8f5e9 60%, #a5d6a7 100%)',
        color: '#1b5e20',
        fontWeight: 'bold',
        boxShadow: '0 0 4px #388e3c44',
        cursor: 'pointer',
      },
      reset: {
        padding: '2px 8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        background: '#e3e3e3',
        color: '#333',
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
