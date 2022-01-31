import { useState, useMemo, useEffect } from 'react';
import { OutputAreaModel } from '@jupyterlab/outputarea';
import * as nbformat from '@jupyterlab/nbformat';
import OutputAdapter from './OutputAdapter';
import Kernel from '../../services/kernel/Kernel';
import CodeMirrorEditor from '../editor/CodeMirrorEditor';
import LuminoAttached from '../../lumino/LuminoAttached';

export type IOutputProps = {
  initialOutput?: [nbformat.IOutput];
  kernel: Kernel;
  autoRun: boolean;
  showEditor: boolean;
  code: string;
  executeTrigger: number;
  clearTrigger: number;
}

const OutputLumino = (props: IOutputProps) => {
  const { initialOutput, autoRun, code, kernel, showEditor, executeTrigger, clearTrigger } = props;
  const [model] = useState(new OutputAreaModel({
    trusted: true,
    values: initialOutput,
  }));
  const outputAdapter = useMemo(() => { return new OutputAdapter(
    kernel.getJupyterKernel(),
    model,
    {},
  )}, []);
  useEffect(() => {
    if (!showEditor && autoRun) {
      outputAdapter.execute(code);
    }
  }, [executeTrigger]);
  useEffect(() => {
    if (showEditor) {
    outputAdapter.execute(code);
    }
  }, [executeTrigger]);
  useEffect(() => {
    if (showEditor) {
      outputAdapter.clearOutput();
    }
  }, [clearTrigger]);
  return <div>
    <div>
      { showEditor &&
        <CodeMirrorEditor
          autoRun={autoRun}
          code={code}
          outputAdapter={outputAdapter}
        />
      }
    </div>
    <div
      css={{
        '& .jp-OutputPrompt': {
          display: 'none',
        },
      }}
    >
      <LuminoAttached>{outputAdapter.panel}</LuminoAttached>
    </div>
  </div>
}

OutputLumino.defaultProps = {
  initialOutput: [
    {
      "output_type": "execute_result",
      "data": {
        "text/html": [
          "<h3>I am the default output...  👉  Run the cell to update me...  👀</h3>"
        ]
      },
      "execution_count": 0,
      "metadata": {},
    }
  ],
  executeTrigger: 0,
  clearTrigger: 0,
} as Partial<IOutputProps>;

export default OutputLumino;
