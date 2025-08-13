/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useState, useEffect } from 'react';
import { Box, Button, Heading, Text } from '@primer/react';
import { 
  Jupyter,
  Notebook,
  useJupyter,
  jupyterReactStore,
  collaborationProviderRegistry,
  ICollaborationProvider
} from '../../index'; // Import from jupyter-react package

/**
 * Comprehensive example demonstrating all generic features from jupyter-ui
 * without any Datalayer-specific dependencies.
 */
export const GenericCollaborationExample: React.FC = () => {
  const [collaborative, setCollaborative] = useState<ICollaborationProvider>('jupyter');
  const [kernelStatus, setKernelStatus] = useState<string>('idle');
  const [notebookPath] = useState<string>('example.ipynb');
  const [showEditor, setShowEditor] = useState<boolean>(true);
  
  const { kernel, serviceManager } = useJupyter();
  
  // Monitor kernel status using generic state
  useEffect(() => {
    const unsubscribe = jupyterReactStore.subscribe(
      state => {
        const kernel = state.kernel;
        if (kernel?.connection) {
          setKernelStatus(kernel.connection.status);
        }
      }
    );
    return unsubscribe;
  }, []);

  // Get available collaboration providers
  const availableProviders = collaborationProviderRegistry.getProviderNames();

  const handleProviderChange = (provider: string) => {
    if (collaborationProviderRegistry.hasProvider(provider)) {
      setCollaborative(provider);
    } else {
      console.error(`Provider '${provider}' not registered`);
    }
  };

  const handleExecuteCode = async () => {
    if (kernel?.connection) {
      const code = 'print("Hello from generic jupyter-ui!")';
      const future = kernel.connection.requestExecute({ code });
      
      future.onIOPub = (msg: any) => {
        console.log('Kernel message:', msg);
      };
      
      await future.done;
      console.log('Code execution complete');
    }
  };

  return (
    <Box p={4}>
      <Heading sx={{ mb: 3 }}>Generic Jupyter-UI Example</Heading>
      
      {/* Collaboration Provider Selection */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Collaboration Providers</Heading>
        <Text as="p" sx={{ mb: 2 }}>
          Available providers: {availableProviders.join(', ')}
        </Text>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {availableProviders.map(provider => (
            <Button
              key={provider}
              variant={collaborative === provider ? 'primary' : 'default'}
              onClick={() => handleProviderChange(provider)}
            >
              Use {provider}
            </Button>
          ))}
        </Box>
        <Text as="p" sx={{ mt: 2, fontSize: 1, color: 'fg.subtle' }}>
          Current: {collaborative || 'none'}
        </Text>
      </Box>

      {/* Kernel Status */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Kernel Management</Heading>
        <Text as="p">
          Kernel Status: <strong>{kernelStatus}</strong>
        </Text>
        <Button onClick={handleExecuteCode} sx={{ mt: 2 }}>
          Execute Test Code
        </Button>
      </Box>

      {/* Code Editor Status */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Editor Controls</Heading>
        <Button onClick={() => setShowEditor(!showEditor)} sx={{ mb: 2 }}>
          {showEditor ? 'Hide' : 'Show'} Editor in Notebook
        </Button>
        <Text as="p" sx={{ fontSize: 1, color: 'fg.subtle' }}>
          The notebook component includes built-in code editing capabilities
        </Text>
      </Box>

      {/* Main Jupyter Environment */}
      <Jupyter
        jupyterServerUrl="http://localhost:8888"
        jupyterServerToken="test-token"
        serviceManager={serviceManager}
      >
        <Box sx={{ border: '1px solid', borderColor: 'border.default', borderRadius: 2, p: 3 }}>
          <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>
            Generic Notebook Component
          </Heading>
          
          <Notebook
            path={notebookPath}
            collaborative={collaborative}
            height="600px"
            id="generic-notebook"
            kernel={kernel}
            serviceManager={serviceManager}
            readonly={false}
            cellSidebarMargin={120}
          />
        </Box>
      </Jupyter>

      {/* State Information */}
      <Box sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>State Information</Heading>
        <StateDisplay />
      </Box>
    </Box>
  );
};

/**
 * Component to display current state from JupyterReactState
 */
const StateDisplay: React.FC = () => {
  const [stateInfo, setStateInfo] = useState<any>({});

  useEffect(() => {
    const updateState = () => {
      const state = jupyterReactStore.getState();
      setStateInfo({
        hasKernel: !!state.kernel,
        kernelStatus: state.kernel?.connection?.status || 'unknown',
        notebookCount: Object.keys(state.notebookStore?.notebooks || {}).length,
        cellsCount: Object.keys(state.cellsStore?.cells || {}).length,
      });
    };

    updateState();
    const unsubscribe = jupyterReactStore.subscribe(updateState);
    return unsubscribe;
  }, []);

  return (
    <Box sx={{ fontFamily: 'mono', fontSize: 1 }}>
      <Text as="pre">
        {JSON.stringify(stateInfo, null, 2)}
      </Text>
    </Box>
  );
};

export default GenericCollaborationExample;