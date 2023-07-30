import { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ActionMenu, ActionList, Box, IconButton, ProgressBar } from '@primer/react'
import { KebabHorizontalIcon, StopIcon, PaintbrushIcon } from '@primer/octicons-react';
import { UUID } from '@lumino/coreutils';
import { IOutput } from '@jupyterlab/nbformat';
import { Kernel as JupyterKernel, KernelMessage } from '@jupyterlab/services';
import OutputAdapter from './OutputAdapter';
import { selectExecute, outputActions, outputReducer } from './OutputState';
import { useJupyter } from "../../jupyter/JupyterContext";
import Kernel from '../../jupyter/services/kernel/Kernel';
import Lumino from '../../jupyter/lumino/Lumino';
import CodeMirrorEditor from '../codemirror/CodeMirrorEditor';
import OutputRenderer from './OutputRenderer';

import './Output.css';

export type IOutputProps = {
  outputs?: IOutput[];
  adapter?: OutputAdapter;
  kernel: Kernel;
  autoRun: boolean;
  disableRun: boolean;
  showEditor: boolean;
  code: string;
  codePre?: string;
  clearTrigger: number;
  sourceId: string;
  receipt?: string;
  executeTrigger: number;
  toolbarPosition: 'up' | 'middle' | 'none';
  insertText?: (payload?: any) => string;
  luminoWidgets: boolean;
}

type Props = {
  outputAdapter: OutputAdapter;
}

const KernelProgressMenu = (props: Props) => {
  const { outputAdapter } = props;
  return (
    <ActionMenu>
      <ActionMenu.Anchor>
        <IconButton aria-labelledby="" icon={KebabHorizontalIcon} variant="invisible"/>
      </ActionMenu.Anchor>
      <ActionMenu.Overlay>
        <ActionList>
          <ActionList.Item onSelect={ e => { e.preventDefault(); outputAdapter.interrupt() }}>
            <ActionList.LeadingVisual>
              <StopIcon />
            </ActionList.LeadingVisual>
            Interrupt kernel
          </ActionList.Item>
          <ActionList.Item variant="danger" onClick={ e => { e.preventDefault(); outputAdapter.clearOutput() }}>
            <ActionList.LeadingVisual>
              <PaintbrushIcon />
            </ActionList.LeadingVisual>
            Clear outputs
          </ActionList.Item>
        </ActionList>
      </ActionMenu.Overlay>
    </ActionMenu>
  )
}

const KernelProgressBar = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((oldValue: number) => {
        let newValue = oldValue + 1;
        if (newValue > 100) {
          newValue = 0;
        }
        return newValue;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [])
  return (
    <ProgressBar progress={progress} barSize="small" />
  )
}

export const Output = (props: IOutputProps) => {
  const { injectableStore, defaultKernel: kernel } = useJupyter();
  const {
    sourceId, autoRun, code, showEditor, clearTrigger, executeTrigger, adapter,
    receipt, disableRun, insertText, toolbarPosition, codePre, luminoWidgets: useLumino
  } = props;
  const dispatch = useDispatch();
  const [id, setId] = useState<string | undefined>(sourceId);
  const [kernelStatus, setKernelStatus] = useState<KernelMessage.Status>('unknown');
  const [outputAdapter, setOutputAdapter] = useState<OutputAdapter>();
  const [outputs, setOutputs] = useState<IOutput[] | undefined>(props.outputs);
  useMemo(() => {
      injectableStore.inject('output', outputReducer);
  }, [sourceId]);
  useEffect(() => {
    if (!id) {
      setId(UUID.uuid4());
    }
  }, []);
  useEffect(() => {
    if (id && kernel) {
      const outputAdapter = adapter || new OutputAdapter(kernel, outputs || []);
      if (receipt) {
        outputAdapter.outputArea.model.changed.connect((sender, change) => {
          if (change.type === 'add') {
            change.newValues.map(val => {
              if (val && val.data) {
                const out = val.data['text/html']; // val.data['application/vnd.jupyter.stdout'];
                if (out) {
                  if ((out as string).indexOf(receipt) > -1) {
                    dispatch(outputActions.grade({
                      sourceId,
                      success: true,
                    }));
                  }
                }
              }
            });
          }
        });
      }
      setOutputAdapter(outputAdapter);
      outputAdapter.outputArea.model.changed.connect((outputModel, args) => {
        setOutputs(outputModel.toJSON());
      });
    }
  }, [id, kernel]);
  useEffect(() => {
    if (outputAdapter) {
      if (!outputAdapter.kernel) {
        outputAdapter.kernel = kernel;
      }
      if (autoRun) {
        outputAdapter.execute(code);
      }
    }
  }, [outputAdapter]);
  useEffect(() => {
    if (kernel) {
      kernel.connection.then((kernelConnection: JupyterKernel.IKernelConnection) => {
        setKernelStatus(kernelConnection.status);
        kernelConnection.statusChanged.connect((kernelConnection, status) => {
          setKernelStatus(status);
        })
      });
      return () => {
//        kernel.connection.then(k => k.shutdown().then(() => console.log(`Kernel ${k.id} is terminated.`)));
      }
    }
  }, [kernel]);
  const executeRequest = selectExecute(sourceId);
  useEffect(() => {
    if (outputAdapter && executeRequest && executeRequest.sourceId === id) {
      outputAdapter.execute(executeRequest.source);
    }
  }, [executeRequest, outputAdapter]);
  useEffect(() => {
    if (outputAdapter && executeTrigger > 0) {
      outputAdapter.execute(code);
    }
  }, [executeTrigger]);
  useEffect(() => {
    if (outputAdapter && clearTrigger > 0) {
      outputAdapter.clearOutput();
    }
  }, [clearTrigger, outputAdapter]);
  return (
    <>
      { showEditor && outputAdapter && id &&
        <Box
          sx={{
            '& .cm-editor': {
              borderRadius: '5px',
            },
          }}
        >
          <CodeMirrorEditor
            autoRun={autoRun}
            code={code}
            codePre={codePre}
            kernel={kernel}
            outputAdapter={outputAdapter}
            sourceId={id}
            disableRun={disableRun}
            insertText={insertText}
            toolbarPosition={toolbarPosition}
          />
        </Box>
      }
      { outputAdapter &&
        <Box display="flex">
          <Box flexGrow={1}>
          { kernelStatus !== 'idle' && <KernelProgressBar/> }
          </Box>
          <Box style={{marginTop: "-13px"}}>
            <KernelProgressMenu outputAdapter={outputAdapter}/>
          </Box>
        </Box>
      }
      { outputs &&
        <Box
          sx={{
            '& .jp-OutputArea': {
              fontSize: '10px',
            },
            '& .jp-OutputPrompt': {
//              display: 'none',
            },
            '& .jp-OutputArea-prompt': {
              display: 'none',
//              width: '0px',
            },
            '& pre': {
              fontSize: '12px',
              wordBreak: 'break-all',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            },
          }}
        >
          { useLumino
            ?
              ( outputAdapter &&
                <Lumino>
                  {outputAdapter.outputArea}
                </Lumino>
              )
            :
              ( outputs &&
                <>
                  { outputs.map((output: IOutput) => {
                      return <OutputRenderer output={output}/>
                    })
                  }
                </>
              )
          }
        </Box>
      }
    </>
  )
}

Output.defaultProps = {
  outputs: [
    {
      "output_type": "execute_result",
      "data": {
        "text/html": [
          "<p>Type code in the cell and Shift+Enter to execute.</p>"
        ]
      },
      "execution_count": 0,
      "metadata": {},
    }
  ],
  disableRun: false,
  toolbarPosition: 'up',
  executeTrigger: 0,
  clearTrigger: 0,
  luminoWidgets: true,
} as Partial<IOutputProps>;

export default Output;
