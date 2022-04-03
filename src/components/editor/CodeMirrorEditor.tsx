import { useRef, useEffect } from 'react';
import { basicSetup } from '@codemirror/basic-setup';
import { EditorState } from '@codemirror/state';
import { keymap, EditorView } from '@codemirror/view';
import { python } from '@codemirror/lang-python';
import OutputAdapter from '../outputs/OutputAdapter';

const CodeMirrorEditor = (props: {
  code: string;
  outputAdapter: OutputAdapter;
  autoRun: boolean;
}) => {
  const { code, outputAdapter, autoRun } = props;
  const editor = useRef<HTMLDivElement>();
  useEffect(() => {
    let state: EditorState;
    const keyBinding = [
      {key: 'Shift-Enter', run: () => runCode(), preventDefault: true},
    ];
    state = EditorState.create({
      doc: code,
      extensions: [basicSetup, python(), keymap.of([...keyBinding])],
    });
    const view = new EditorView({
      state: state,
      parent: editor.current,
    });
    const runCode = () => {
      outputAdapter.execute(String(view.state.doc));
      return true;
    };
    if (autoRun) {
      runCode();
    }
    return () => {
      view.destroy();
    };
  }, []);
  return <div ref={editor as any}></div>;
  /*
    return <div ref={ref => {
      if (ref) {
        const kb = [{key: "Shift-Enter", run: () => runCode(), preventDefault: true}];
        let state = EditorState.create({
          doc: code,
          extensions: [
            basicSetup, 
            javascript(),
            keymap.of([...kb]),
          ]
        });
        const view = new EditorView({
          state: state,
          parent: ref,
        });
        const runCode = () => {
          outputLumino.execute(String(view.state.doc));  
          return true;
        };
        runCode();
      };
      return <div ref={ref as any}></div>
    }}/>;
  */
};

export default CodeMirrorEditor;
