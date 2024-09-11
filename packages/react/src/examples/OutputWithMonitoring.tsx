/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IOutput } from '@jupyterlab/nbformat';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { Text } from '@primer/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Output } from '../components/output/Output';
import OutputAdapter from '../components/output/OutputAdapter';
import { useOutputsStore } from '../components/output/OutputState';
import { Jupyter } from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import useKernelsStore, { ExecutionPhase } from '../jupyter/kernel/KernelState';


const SOURCE_ID = 'output-id-2';
const SOURCE = '2+2';
const OUTPUTS: IOutput[] = [
  {
    data: {
      'text/plain': ['4'],
    },
    execution_count: 1,
    metadata: {},
    output_type: 'execute_result',
  },
];

const OutputWithMonitoring = () => {
  const { defaultKernel } = useJupyter();
  const outputStore = useOutputsStore();
  const kernelsStore = useKernelsStore();
  const outputAdapter = outputStore.getAdapter(SOURCE_ID)
  const [outputReceived, setOutputReceived] = useState(false);

  // We save function output listener function state to ref to be able to unsubscribe
  const connectedListenerRef = useRef<(source : IOutputAreaModel, changedArgs : IOutputAreaModel.ChangedArgs) => void | undefined>();

    const handleOutputStateChanged =  useCallback( (source : IOutputAreaModel, changedArgs : IOutputAreaModel.ChangedArgs) => {
        let kernelExecutionPhase : ExecutionPhase | undefined;
        if (defaultKernel?.id) {
            kernelExecutionPhase = kernelsStore.getExecutionPhase(defaultKernel?.id);
        }
        console.log(`Got new output in phase=${kernelExecutionPhase}`);
        if (changedArgs.type !== 'remove') {            
            if (changedArgs.newValues.length > 0) {
                const outputValue = changedArgs.newValues[0];
                if (outputValue.type === 'error') {
                    if (outputValue.data && outputValue.data['application/vnd.jupyter.error']) {
                        const errObject : any = outputValue.data['application/vnd.jupyter.error'];
                        if (errObject.ename && errObject.evalue) {
                            console.log(`Cell execution finished with error of type :${errObject.ename} and message: ${errObject.evalue}`)                            
                        }
                    } 
                    else {
                        console.log(`Cell execution finished with error : ${outputValue.data}`)
                    }
                }
                else if (outputValue.type === 'stream' && outputValue.data['application/vnd.jupyter.stderr']) {
                    // In fact it's a warning with successful execution
                    console.log(`Cell execution generated warning : ${outputValue.data['application/vnd.jupyter.stderr']}`)
                }
                else if (outputValue.type === 'display_data' || outputValue.type === 'stream') {
                    console.log(`Cell execution finished successfully : ${outputValue.toJSON()}`)    
                }
            }
        }
        else {            
            console.log(`Got remove message`);
        }    
    },[defaultKernel?.id])


  useEffect(() => {    

    function disconnectOutputAdapter(this:any, outputAdapter : OutputAdapter | undefined) {
        if (outputAdapter && connectedListenerRef.current) {
            const disconnected = outputAdapter.outputArea.model.changed
                                        .disconnect(connectedListenerRef.current)
            if (disconnected) {
                console.log(`Disconnected from output`);                                
            }
        }
    }

    function connectOutputAdapter(this:any, outputAdapter : OutputAdapter | undefined) {
        if (outputAdapter) {
            connectedListenerRef.current = handleOutputStateChanged;
            const connected = outputAdapter.outputArea.model.changed.connect(handleOutputStateChanged);
            if (connected) {
                console.log(`Connected to output`)
            }
        }
    }
    if (outputAdapter) {
      if (outputReceived) {
        disconnectOutputAdapter()
      }
    }
},[outputReceived, outputAdapter])


  console.log(
    'Outputs',
    outputStore.getModel(SOURCE_ID)?.toJSON(),
    outputStore.getInput(SOURCE_ID),
  );

  return (
    <>
      <Text as="h1">Output with Code Editor</Text>
      <Output
        autoRun={false}
        code={SOURCE}
        id={SOURCE_ID} 
        kernel={defaultKernel}
        outputs={OUTPUTS}
        notifyOnComplete={true}
        showEditor
      />
    </>
  );
};


const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter>
    <OutputWithMonitoring />
  </Jupyter>
);
