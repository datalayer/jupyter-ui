/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IOutput } from '@jupyterlab/nbformat';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { KernelMessage } from '@jupyterlab/services';
import { Box } from '@datalayer/primer-addons';
import { useEffect, useState } from 'react';
import { Lumino } from '../lumino/Lumino';
import { useJupyter } from '../../jupyter/JupyterContext';
import { IExecutionPhaseOutput, Kernel } from '../../jupyter/kernel';
import { newUuid } from '../../utils';
import { KernelActionMenu, KernelProgressBar } from '../kernel';
import { CodeMirrorEditor } from '../codemirror';
import { OutputAdapter } from './OutputAdapter';
import { OutputRenderer } from './OutputRenderer';
import { useOutputsStore } from './OutputState';

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
  onExecutionPhaseChanged?: (phaseOutput: IExecutionPhaseOutput) => void;
  outputs?: IOutput[];
  receipt?: string;
  showControl?: boolean;
  showEditor: boolean;
  showKernelProgressBar?: boolean;
  suppressCodeExecutionErrors?: boolean;
  toolbarPosition: 'up' | 'middle' | 'none';
};

export const Output = (props: IOutputProps) => {
  const {
    adapter: propsAdapter,
    autoRun,
    clearTrigger,
    code,
    codePre,
    disableRun,
    executeTrigger,
    id: sourceId,
    insertText,
    kernel: propsKernel,
    lumino,
    model,
    onExecutionPhaseChanged,
    outputs: propsOutputs,
    receipt,
    showControl,
    showEditor,
    showKernelProgressBar = true,
    suppressCodeExecutionErrors = false,
    toolbarPosition,
  } = props;
  const { defaultKernel } = useJupyter();
  const outputStore = useOutputsStore();
  const kernel = propsKernel ?? propsAdapter?.kernel ?? defaultKernel;
  const [id, setId] = useState<string | undefined>(sourceId);
  const [kernelStatus, setKernelStatus] =
    useState<KernelMessage.Status>('unknown');
  const [outputs, setOutputs] = useState<IOutput[] | undefined>(propsOutputs);
  const [adapter, setAdapter] = useState<OutputAdapter>();

  // Sync outputs when propsOutputs changes
  useEffect(() => {
    setOutputs(propsOutputs);
  }, [propsOutputs]);

  // Force Lumino widget update when executeTrigger changes
  useEffect(() => {
    if (lumino && adapter?.outputArea) {
      console.warn(
        '🔄 Forcing Lumino widget update due to executeTrigger change:',
        executeTrigger
      );
      adapter.outputArea.update();
    }
  }, [executeTrigger, lumino, adapter]);

  useEffect(() => {
    if (!id) {
      setId(newUuid());
    }
  }, [id]);
  useEffect(() => {
    const outputsCallback = (
      model: IOutputAreaModel,
      _: IOutputAreaModel.ChangedArgs
    ) => {
      setOutputs(model.toJSON());
      if (id) {
        outputStore.setModel(id, model);
      }
    };
    const receiptCallback = (
      model: IOutputAreaModel,
      change: IOutputAreaModel.ChangedArgs
    ) => {
      if (receipt && change.type === 'add') {
        change.newValues.map(val => {
          if (val && val.data) {
            const out = val.data['text/html']; // val.data['application/vnd.jupyter.stdout'];
            if (out) {
              if ((out as string).indexOf(receipt) > -1) {
                outputStore.setGradeSuccess(sourceId, true);
              }
            }
          }
        });
      }
    };
    if (id && kernel) {
      const adapter =
        propsAdapter ??
        new OutputAdapter(
          id,
          kernel,
          outputs ?? [],
          model,
          suppressCodeExecutionErrors
        );
      setAdapter(adapter);
      outputStore.setAdapter(id, adapter);
      if (model) {
        outputStore.setModel(id, model);
      }
      if (code) {
        outputStore.setInput(id, code);
      }
      adapter.outputArea.model.changed.connect(outputsCallback);
      if (receipt) {
        adapter.outputArea.model.changed.connect(receiptCallback);
      }
    }
    return () => {
      if (adapter) {
        adapter.outputArea.model.changed.disconnect(outputsCallback);
        adapter.outputArea.model.changed.disconnect(receiptCallback);
      }
    };
  }, [id, kernel]);
  useEffect(() => {
    if (adapter) {
      if (autoRun) {
        adapter.kernel?.ready.then(() => {
          adapter.execute(code, onExecutionPhaseChanged);
        });
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
        // kernel.connection.then(k => k.shutdown().then(() => console.log(`Kernel ${k.id} is terminated.`)));
      };
    } else {
      // Reset kernel status when kernel becomes undefined (e.g., runtime terminated)
      // This prevents zombie progress bars from showing
      setKernelStatus('idle');
    }
  }, [kernel]);
  const executeRequest = outputStore.getExecuteRequest(sourceId);
  useEffect(() => {
    if (adapter && executeRequest && executeRequest === id) {
      adapter.execute(code, onExecutionPhaseChanged);
    }
  }, [executeRequest, adapter]);
  useEffect(() => {
    if (adapter && executeTrigger > 0) {
      adapter.execute(code, onExecutionPhaseChanged);
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
            {kernel && kernelStatus !== 'idle' && showKernelProgressBar && (
              <KernelProgressBar />
            )}
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
            margin: 0,
            padding: 0,
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
          {(() => {
            const currentAdapter = adapter || propsAdapter;
            return lumino ? (
              currentAdapter ? (
                <Lumino>{currentAdapter.outputArea}</Lumino>
              ) : null
            ) : (
              outputs && (
                <>
                  {outputs.map((output: IOutput, index: number) => {
                    return <OutputRenderer key={index} output={output} />;
                  })}
                </>
              )
            );
          })()}
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
  notifyOnComplete: false,
  toolbarPosition: 'up',
} as Partial<IOutputProps>;

export default Output;
