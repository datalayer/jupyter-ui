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
  // CRITICAL: If adapter exists, use adapter.kernel even if undefined
  // Don't fall back to defaultKernel when adapter.kernel is explicitly set to undefined (runtime terminated)
  const resolvedKernel =
    propsKernel ?? (propsAdapter ? propsAdapter.kernel : defaultKernel);
  // CRITICAL: Treat disconnected kernels as undefined (runtime terminated)
  // Don't show indicator or menu for disconnected kernels
  const kernel =
    resolvedKernel &&
    resolvedKernel.connection?.connectionStatus !== 'disconnected'
      ? resolvedKernel
      : undefined;
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
      // CRITICAL: When kernel is undefined/disconnected, FREEZE outputs - don't update from model changes
      // This prevents outputs from being cleared when runtime terminates
      // Only update outputs when we have an active kernel
      if (kernel) {
        setOutputs(model.toJSON());
        if (id) {
          outputStore.setModel(id, model);
        }
      }
      // If no kernel, keep the last known outputs (don't clear them)
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
    // CRITICAL: Use propsAdapter if provided, even when kernel is undefined (runtime terminated)
    // This preserves outputs after runtime termination
    if (id && (propsAdapter || kernel)) {
      const adapter =
        propsAdapter ??
        new OutputAdapter(
          id,
          kernel!,
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
      {(adapter || propsAdapter) && (
        <Box display="flex">
          <Box flexGrow={1}>
            {kernel && kernelStatus !== 'idle' && showKernelProgressBar && (
              <KernelProgressBar />
            )}
          </Box>
          {showControl && kernel && (adapter || propsAdapter) && (
            <Box style={{ marginTop: '-13px' }}>
              <KernelActionMenu
                kernel={kernel}
                outputAdapter={adapter || propsAdapter}
              />
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

export default Output;
