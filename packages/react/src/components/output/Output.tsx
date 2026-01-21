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
import { useJupyter } from '../../jupyter/JupyterUse';
import { IExecutionPhaseOutput, Kernel } from '../../jupyter/kernel';
import { newUuid } from '../../utils';
import { KernelActionMenu, KernelProgressBar } from '../kernel';
import { CodeMirrorEditor } from '../codemirror';
import { OutputAdapter } from './OutputAdapter';
import { OutputRenderer } from './OutputRenderer';
import { useOutputsStore } from './OutputState';

import './Output.css';

const DEFAULT_OUTPUTS: IOutput[] = [
  {
    output_type: 'execute_result',
    data: {
      'text/html': ['<p>Type code in the cell and Shift+Enter to execute.</p>'],
    },
    execution_count: 0,
    metadata: {},
  },
];

export type IOutputProps = {
  adapter?: OutputAdapter;
  autoRun?: boolean;
  clearTrigger?: number;
  code?: string;
  codePre?: string;
  disableRun?: boolean;
  executeTrigger?: number;
  id?: string;
  insertText?: (payload?: any) => string;
  kernel?: Kernel;
  lumino?: boolean;
  model?: IOutputAreaModel;
  onExecutionPhaseChanged?: (phaseOutput: IExecutionPhaseOutput) => void;
  outputs?: IOutput[];
  receipt?: string;
  showControl?: boolean;
  showEditor?: boolean;
  showKernelProgressBar?: boolean;
  suppressCodeExecutionErrors?: boolean;
  toolbarPosition?: 'up' | 'middle' | 'none';
  notifyOnComplete?: boolean;
};

export const Output = ({
  adapter: propsAdapter,
  autoRun = false,
  clearTrigger = 0,
  code = '',
  codePre,
  disableRun = false,
  executeTrigger = 0,
  id: sourceId,
  insertText,
  kernel: propsKernel,
  lumino = true,
  model,
  onExecutionPhaseChanged,
  outputs: propsOutputs = DEFAULT_OUTPUTS,
  receipt,
  showControl = true,
  showEditor = false,
  showKernelProgressBar = true,
  suppressCodeExecutionErrors = false,
  toolbarPosition = 'up',
  notifyOnComplete = false,
}: IOutputProps) => {
  void notifyOnComplete;
  const { defaultKernel } = useJupyter();
  const outputStore = useOutputsStore();
  const kernel = propsKernel ?? propsAdapter?.kernel ?? defaultKernel;
  const [id, setId] = useState<string>(() => sourceId ?? newUuid());
  const resolvedSourceId = sourceId ?? id;
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
    if (sourceId && sourceId !== id) {
      setId(sourceId);
    }
  }, [sourceId, id]);
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
                outputStore.setGradeSuccess(resolvedSourceId, true);
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
  const executeRequest = outputStore.getExecuteRequest(resolvedSourceId);
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
      <Box
        sx={{
          position: 'relative',
          margin: 0,
          padding: 0,
          paddingTop: '2px',
          minHeight: '20px',
        }}
      >
        {/* Floating controls (progress bar + action menu) in gap above output */}
        {adapter && (kernel || showControl) && (
          <Box
            sx={{
              position: 'absolute',
              top: '-5px',
              left: 0,
              right: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: 0,
              padding: 0,
              backgroundColor: 'transparent',
              transition: 'opacity 0.2s ease-in-out',
              opacity: 1,
              pointerEvents: showControl ? 'auto' : 'none',
              height: '3px',
              '& span[data-component="ProgressBar"]': {
                height: '3px !important',
                backgroundColor: 'transparent !important',
              },
              '& .Progress': {
                height: '3px !important',
                backgroundColor: 'transparent !important',
              },
              '& .Progress-item': {
                height: '3px !important',
              },
              '& [role="progressbar"]': {
                height: '3px !important',
              },
            }}
          >
            <Box
              flexGrow={1}
              sx={{
                height: '3px',
                backgroundColor: 'rgba(128, 128, 128, 0.2)',
                position: 'relative',
              }}
            >
              {kernel && kernelStatus !== 'idle' && showKernelProgressBar && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: 'transparent',
                    '& > *': {
                      backgroundColor: 'transparent !important',
                    },
                  }}
                >
                  <KernelProgressBar />
                </Box>
              )}
            </Box>
            {showControl && (
              <Box
                sx={{
                  marginLeft: '4px',
                  height: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  '& button': {
                    height: '12px !important',
                    width: '16px !important',
                    minWidth: '16px !important',
                    padding: '0 !important',
                    borderRadius: '2px !important',
                  },
                  '& button svg': {
                    width: '10px !important',
                    height: '10px !important',
                  },
                }}
              >
                <KernelActionMenu kernel={kernel} outputAdapter={adapter} />
              </Box>
            )}
          </Box>
        )}

        {/* Output area */}
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
      </Box>
    </>
  );
};

export default Output;
