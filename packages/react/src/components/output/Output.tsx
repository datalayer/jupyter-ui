/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { Box } from '@primer/react';
import { IOutput } from '@jupyterlab/nbformat';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { KernelMessage } from '@jupyterlab/services';
import { newUuid } from '../../utils';
import { useJupyter } from '../../jupyter/JupyterContext';
import { Kernel } from '../../jupyter/kernel/Kernel';
import { KernelActionMenu, KernelProgressBar } from './../kernel';
import { Lumino } from '../lumino/Lumino';
import { CodeMirrorEditor } from '../codemirror/CodeMirrorEditor';
import { OutputAdapter } from './OutputAdapter';
import { OutputRenderer } from './OutputRenderer';
import { useOutputStore } from './OutputState';

import './Output.css';

export type IOutputProps = {
  adapter?: OutputAdapter;
  autoRun: boolean;
  clearTrigger: number;
  code: string;
  codePre?: string;
  disableRun: boolean;
  executeTrigger: number;
  id: string;
  insertText?: (payload?: any) => string;
  kernel?: Kernel;
  lumino: boolean;
  model?: IOutputAreaModel;
  outputs?: IOutput[];
  receipt?: string;
  showControl?: boolean;
  showEditor: boolean;
  showKernelProgressBar?: boolean;
  toolbarPosition: 'up' | 'middle' | 'none';
};

export const Output = (props: IOutputProps) => {
  const { defaultKernel } = useJupyter();
  const outputStore = useOutputStore();
  const {
    adapter: propsAdapter,
    autoRun,
    clearTrigger,
    code,
    codePre,
    disableRun,
    executeTrigger,
    insertText,
    kernel: propsKernel,
    lumino,
    model,
    outputs: propsOutputs,
    receipt,
    showControl,
    showEditor,
    showKernelProgressBar = true,
    id: sourceId,
    toolbarPosition,
  } = props;
  const kernel = propsKernel ?? defaultKernel;
  const [id, setId] = useState<string | undefined>(sourceId);
  const [kernelStatus, setKernelStatus] = useState<KernelMessage.Status>('unknown');
  const [outputs, setOutputs] = useState<IOutput[] | undefined>(propsOutputs);
  const [adapter, setAdapter] = useState<OutputAdapter>();
  useEffect(() => {
    if (!id) {
      setId(newUuid());
    }
  }, []);
  useEffect(() => {
    if (id && kernel) {
      const adapter = propsAdapter ?? new OutputAdapter(kernel, outputs ?? [], model);
      setAdapter(adapter);
      outputStore.setAdapter(id, adapter);
      if (model) {
        outputStore.setOutput({
          id,
          model: model,
        })
      }
      if (code) {
        outputStore.setInput({
          id,
          input: code,
        })
      }
      adapter.outputArea.model.changed.connect((model, change) => {
        setOutputs(model.toJSON());
        outputStore.setOutput({
          id,
          model,
        });
      });
      if (receipt) {
        adapter.outputArea.model.changed.connect((sender, change) => {
          if (change.type === 'add') {
            change.newValues.map(val => {
              if (val && val.data) {
                const out = val.data['text/html']; // val.data['application/vnd.jupyter.stdout'];
                if (out) {
                  if ((out as string).indexOf(receipt) > -1) {
                    outputStore.setGrade({
                      id: sourceId,
                      success: true,
                    });
                  }
                }
              }
            });
          }
        });
      }
    }
  }, [id, kernel]);
  useEffect(() => {
    if (adapter) {
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
  const executeRequest = outputStore.getExecute(sourceId);
  useEffect(() => {
    if (adapter && executeRequest && executeRequest.id === id) {
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
            {kernelStatus !== 'idle' && showKernelProgressBar && <KernelProgressBar />}
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
  autoRun: false,
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
