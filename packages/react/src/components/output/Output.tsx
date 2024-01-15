/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box } from '@primer/react';
import { UUID } from '@lumino/coreutils';
import { IOutput } from '@jupyterlab/nbformat';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { KernelMessage } from '@jupyterlab/services';
import { useJupyter } from '../../jupyter/JupyterContext';
import Kernel from '../../jupyter/kernel/Kernel';
import { KernelActionMenu, KernelProgressBar } from './../kernel';
import Lumino from '../lumino/Lumino';
import CodeMirrorEditor from '../codemirror/CodeMirrorEditor';
import { selectExecute, outputActions, outputReducer } from './OutputRedux';
import OutputAdapter from './OutputAdapter';
import OutputRenderer from './OutputRenderer';

import './Output.css';

export type IOutputProps = {
  adapter?: OutputAdapter;
  autoRun: boolean;
  clearTrigger: number;
  code: string;
  codePre?: string;
  disableRun: boolean;
  executeTrigger: number;
  insertText?: (payload?: any) => string;
  kernel: Kernel;
  lumino: boolean;
  model?: IOutputAreaModel;
  outputs?: IOutput[];
  receipt?: string;
  showControl?: boolean;
  showEditor: boolean;
  sourceId: string;
  toolbarPosition: 'up' | 'middle' | 'none';
};

export const Output = (props: IOutputProps) => {
  const { injectableStore, defaultKernel: kernel } = useJupyter();
  const {
    adapter: propsAdapter,
    autoRun,
    clearTrigger,
    code,
    codePre,
    disableRun,
    executeTrigger,
    insertText,
    lumino,
    model,
    receipt,
    showControl,
    showEditor,
    sourceId,
    toolbarPosition,
  } = props;
  const dispatch = useDispatch();
  const [id, setId] = useState<string | undefined>(sourceId);
  const [kernelStatus, setKernelStatus] =
    useState<KernelMessage.Status>('unknown');
  const [outputs, setOutputs] = useState<IOutput[] | undefined>(props.outputs);
  const [adapter, setAdapter] = useState<OutputAdapter>();
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
      const adapter =
        propsAdapter ?? new OutputAdapter(kernel, outputs ?? [], model);
      if (receipt) {
        adapter.outputArea.model.changed.connect((sender, change) => {
          if (change.type === 'add') {
            change.newValues.map(val => {
              if (val && val.data) {
                const out = val.data['text/html']; // val.data['application/vnd.jupyter.stdout'];
                if (out) {
                  if ((out as string).indexOf(receipt) > -1) {
                    dispatch(
                      outputActions.grade({
                        sourceId,
                        success: true,
                      }),
                    );
                  }
                }
              }
            });
          }
        });
      }
      setAdapter(adapter);
      adapter.outputArea.model.changed.connect((outputModel, args) => {
        setOutputs(outputModel.toJSON());
      });
    }
  }, [id, kernel]);
  useEffect(() => {
    if (adapter) {
      if (!adapter.kernel) {
        adapter.kernel = kernel;
      }
      if (autoRun) {
        adapter.execute(code);
      }
    }
  }, [adapter]);
  useEffect(() => {
    if (kernel) {
      kernel.ready.then(() => {
        setKernelStatus(kernel.connection!.status);
        kernel.connection!.statusChanged.connect((kernelConnection, status) => {
          setKernelStatus(status);
        });
      });
      return () => {
        //        kernel.connection.then(k => k.shutdown().then(() => console.log(`Kernel ${k.id} is terminated.`)));
      };
    }
  }, [kernel]);
  const executeRequest = selectExecute(sourceId);
  useEffect(() => {
    if (adapter && executeRequest && executeRequest.sourceId === id) {
      adapter.execute(executeRequest.source);
    }
  }, [executeRequest, adapter]);
  useEffect(() => {
    if (adapter && executeTrigger > 0) {
      adapter.execute(code);
    }
  }, [executeTrigger]);
  useEffect(() => {
    if (adapter && clearTrigger > 0) {
      adapter.clear();
    }
  }, [clearTrigger, adapter]);
  return (
    <>
      {showEditor && adapter && id && (
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
            disableRun={disableRun}
            insertText={insertText}
            kernel={kernel}
            outputAdapter={adapter}
            sourceId={id}
            toolbarPosition={toolbarPosition}
          />
        </Box>
      )}
      {adapter && (
        <Box display="flex">
          <Box flexGrow={1}>
            {kernelStatus !== 'idle' && <KernelProgressBar />}
          </Box>
          {showControl && (
            <Box style={{ marginTop: '-13px' }}>
              <KernelActionMenu kernel={kernel} outputAdapter={adapter} />
            </Box>
          )}
        </Box>
      )}
      {outputs && (
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
          {lumino
            ? adapter && <Lumino>{adapter.outputArea}</Lumino>
            : outputs && (
                <>
                  {outputs.map((output: IOutput) => {
                    return <OutputRenderer output={output} />;
                  })}
                </>
              )}
        </Box>
      )}
    </>
  );
};

Output.defaultProps = {
  clearTrigger: 0,
  disableRun: false,
  executeTrigger: 0,
  showControl: true,
  lumino: true,
  outputs: [
    {
      output_type: 'execute_result',
      data: {
        'text/html': [
          '<p>Type code in the cell and Shift+Enter to execute.</p>',
        ],
      },
      execution_count: 0,
      metadata: {},
    },
  ],
  toolbarPosition: 'up',
} as Partial<IOutputProps>;

export default Output;
