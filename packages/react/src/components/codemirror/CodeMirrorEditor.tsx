/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useRef, useEffect } from 'react';
import { basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { keymap, EditorView, ViewUpdate } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import Kernel from '../../jupyter/kernel/Kernel';
import OutputAdapter from '../output/OutputAdapter';
import useOutputsStore from '../output/OutputState';
import codeMirrorTheme from './CodeMirrorTheme';
import CodeMirrorOutputToolbar from './CodeMirrorOutputToolbar';

export const CodeMirrorEditor = (props: {
  code: string;
  codePre?: string;
  outputAdapter: OutputAdapter;
  kernel?: Kernel;
  autoRun: boolean;
  disableRun: boolean;
  sourceId: string;
  toolbarPosition: 'up' | 'middle' | 'none';
  insertText?: (payload?: any) => string;
}) => {
  const {
    code,
    codePre,
    outputAdapter,
    autoRun,
    disableRun,
    sourceId,
    toolbarPosition,
    insertText,
    kernel,
  } = props;
  const outputStore = useOutputsStore();
  const [view, setView] = useState<EditorView>();
  const dataset = outputStore.getDataset(sourceId);
  const source = outputStore.getInput(sourceId);
  const editorDiv = useRef<HTMLDivElement>();
  const setEditorSource = (source: string | undefined) => {
    if (view && source) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: source,
        },
      });
    }
  };
  const doInsertText = (payload?: any) => {
    if (view && insertText) {
      view.dispatch({
        changes: {
          from: 0,
          insert: insertText(payload),
        },
      });
    }
  };
  const executeCode = (editorView: EditorView, code?: string) => {
    if (disableRun) {
      alert(
        'Code execution is disabled for this editor. There should be a button on the page to run this editor.'
      );
      return true;
    }
    if (code) {
      outputAdapter.execute(code);
    } else {
      outputAdapter.execute(editorView.state.doc.toString());
    }
    return true;
  };
  useEffect(() => {
    outputStore.setInput(sourceId, code);
    const language = new Compartment();
    const keyBinding = [
      {
        key: 'Shift-Enter',
        run: () => executeCode(editorView),
        preventDefault: true,
      },
    ];
    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        language.of(python()),
        EditorView.lineWrapping,
        keymap.of([...keyBinding]),
        codeMirrorTheme,
        EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
          if (viewUpdate.docChanged) {
            const source = viewUpdate.state.doc.toString();
            outputStore.setInput(sourceId, source);
          }
        }),
      ],
    });
    const editorView = new EditorView({
      state: state,
      parent: editorDiv.current,
    });
    setView(editorView);
    if (autoRun) {
      executeCode(editorView);
    }
    return () => {
      editorView.destroy();
    };
  }, [code]);
  useEffect(() => {
    doInsertText(dataset);
  }, [dataset]);
  useEffect(() => {
    setEditorSource(source);
  }, [source]);
  return (
    <>
      {kernel && toolbarPosition === 'up' && (
        <CodeMirrorOutputToolbar
          editorView={view}
          codePre={codePre}
          kernel={kernel}
          outputAdapter={outputAdapter}
          executeCode={executeCode}
        />
      )}
      <div ref={editorDiv as any}></div>
      {kernel && toolbarPosition === 'middle' && (
        <CodeMirrorOutputToolbar
          editorView={view}
          codePre={codePre}
          kernel={kernel}
          outputAdapter={outputAdapter}
          executeCode={executeCode}
        />
      )}
    </>
  );
};

// Deprecated: Use CodeMirrorEditor instead of CodeMirrorDatalayerEditor
export const CodeMirrorDatalayerEditor = CodeMirrorEditor;

export default CodeMirrorEditor;
