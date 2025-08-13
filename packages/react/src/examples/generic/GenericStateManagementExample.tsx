/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useState, useEffect } from 'react';
import { Box, Button, Heading, Text, TextInput } from '@primer/react';
import { 
  jupyterReactStore,
  useJupyter
} from '../../index';

/**
 * Example demonstrating generic state management with JupyterReactState
 * Shows how to use and extend the state without any Datalayer dependencies
 */
export const GenericStateManagementExample: React.FC = () => {
  const [stateView, setStateView] = useState<'kernel' | 'notebook' | 'cells' | 'all'>('all');
  const [customState, setCustomState] = useState<Record<string, any>>({});
  const { kernel } = useJupyter();

  // Subscribe to specific state slices
  useEffect(() => {
    // Subscribe to kernel state changes
    const unsubKernel = jupyterReactStore.subscribe(
      state => {
        const kernel = state.kernel;
        console.log('Kernel state changed:', kernel);
        updateCustomState('lastKernelUpdate', new Date().toISOString());
      }
    );

    // Subscribe to notebook state changes
    const unsubNotebooks = jupyterReactStore.subscribe(
      state => {
        const notebooks = state.notebookStore?.notebooks;
        console.log('Notebooks state changed:', notebooks);
        updateCustomState('notebookCount', Object.keys(notebooks || {}).length);
      }
    );

    // Subscribe to cell state changes
    const unsubCells = jupyterReactStore.subscribe(
      state => {
        const cells = state.cellsStore?.cells;
        console.log('Cells state changed:', cells);
        updateCustomState('cellCount', Object.keys(cells || {}).length);
      }
    );

    return () => {
      unsubKernel();
      unsubNotebooks();
      unsubCells();
    };
  }, []);

  const updateCustomState = (key: string, value: any) => {
    setCustomState(prev => ({ ...prev, [key]: value }));
  };

  // State actions
  const handleSetKernel = () => {
    if (kernel) {
      jupyterReactStore.setState({ kernel });
      updateCustomState('kernelSet', true);
    }
  };

  const handleClearKernel = () => {
    jupyterReactStore.setState({ kernel: undefined });
    updateCustomState('kernelSet', false);
  };

  const handleUpdateNotebook = () => {
    const state = jupyterReactStore.getState();
    const notebooks = state.notebookStore?.notebooks || {};
    const updatedNotebooks = {
      ...notebooks,
      'example-notebook': {
        id: 'example-notebook',
        path: 'example.ipynb',
        lastModified: new Date().toISOString()
      }
    };
    // Update via the notebookStore
    if (state.notebookStore) {
      state.notebookStore.notebooks = updatedNotebooks;
    }
  };

  const handleAddCell = () => {
    const state = jupyterReactStore.getState();
    const cells = state.cellsStore?.cells || {};
    const newCellId = `cell-${Date.now()}`;
    const updatedCells = {
      ...cells,
      [newCellId]: {
        id: newCellId,
        type: 'code',
        source: '# New cell',
        outputs: []
      }
    };
    // Update via the cellsStore
    if (state.cellsStore) {
      state.cellsStore.cells = updatedCells;
    }
  };

  return (
    <Box p={4}>
      <Heading sx={{ mb: 3 }}>Generic State Management Example</Heading>

      {/* State View Selector */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>State View</Heading>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {(['kernel', 'notebook', 'cells', 'all'] as const).map(view => (
            <Button
              key={view}
              size="small"
              variant={stateView === view ? 'primary' : 'default'}
              onClick={() => setStateView(view)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Button>
          ))}
        </Box>
      </Box>

      {/* State Actions */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>State Actions</Heading>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button onClick={handleSetKernel} size="small">
            Set Kernel
          </Button>
          <Button onClick={handleClearKernel} size="small">
            Clear Kernel
          </Button>
          <Button onClick={handleUpdateNotebook} size="small">
            Update Notebook
          </Button>
          <Button onClick={handleAddCell} size="small">
            Add Cell
          </Button>
        </Box>
      </Box>

      {/* Current State Display */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Current State</Heading>
        <StateViewer view={stateView} />
      </Box>

      {/* Custom State Extensions */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Custom State Extensions</Heading>
        <Text as="p" sx={{ mb: 2, fontSize: 1 }}>
          Example of tracking custom state alongside JupyterReactState:
        </Text>
        <Box sx={{ fontFamily: 'mono', fontSize: 1, p: 2, bg: 'canvas.subtle', borderRadius: 1 }}>
          <pre>{JSON.stringify(customState, null, 2)}</pre>
        </Box>
      </Box>

      {/* State Selectors Example */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>State Selectors</Heading>
        <StateSelectors />
      </Box>

      {/* Interactive Example */}
      <Box sx={{ p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Interactive State Updates</Heading>
        <InteractiveStateExample />
      </Box>
    </Box>
  );
};

/**
 * Component to display current state based on selected view
 */
const StateViewer: React.FC<{ view: string }> = ({ view }) => {
  const [state, setState] = useState<any>({});

  useEffect(() => {
    const updateState = () => {
      const fullState = jupyterReactStore.getState();
      let displayState: any = {};

      switch (view) {
        case 'kernel':
          displayState = {
            kernel: fullState.kernel ? {
              id: fullState.kernel.id,
              name: fullState.kernel.connection?.name,
              status: fullState.kernel.connection?.status
            } : null
          };
          break;
        case 'notebook':
          displayState = { notebooks: fullState.notebookStore?.notebooks };
          break;
        case 'cells':
          displayState = { cells: fullState.cellsStore?.cells };
          break;
        case 'all':
        default:
          displayState = {
            kernel: fullState.kernel ? { 
              id: fullState.kernel.id,
              status: fullState.kernel.connection?.status 
            } : null,
            notebooks: fullState.notebookStore?.notebooks,
            cells: fullState.cellsStore?.cells,
            outputs: fullState.outputStore?.outputs ? Object.keys(fullState.outputStore.outputs).length : 0
          };
      }

      setState(displayState);
    };

    updateState();
    const unsubscribe = jupyterReactStore.subscribe(updateState);
    return unsubscribe;
  }, [view]);

  return (
    <Box sx={{ fontFamily: 'mono', fontSize: 1, p: 2, bg: 'canvas.subtle', borderRadius: 1 }}>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </Box>
  );
};

/**
 * Example of using state selectors
 */
const StateSelectors: React.FC = () => {
  const [kernelId, setKernelId] = useState<string>('');
  const [notebookCount, setNotebookCount] = useState<number>(0);
  const [activeCells, setActiveCells] = useState<number>(0);

  useEffect(() => {
    // Selector for kernel ID
    const unsubKernelId = jupyterReactStore.subscribe(
      state => {
        const id = state.kernel?.id;
        setKernelId(id || 'none');
      }
    );

    // Selector for notebook count
    const unsubNotebookCount = jupyterReactStore.subscribe(
      state => {
        const count = Object.keys(state.notebookStore?.notebooks || {}).length;
        setNotebookCount(count);
      }
    );

    // Selector for active cells
    const unsubActiveCells = jupyterReactStore.subscribe(
      state => {
        const count = Object.values(state.cellsStore?.cells || {}).filter((c: any) => c.active).length;
        setActiveCells(count);
      }
    );

    return () => {
      unsubKernelId();
      unsubNotebookCount();
      unsubActiveCells();
    };
  }, []);

  return (
    <Box>
      <Text as="p" sx={{ mb: 1 }}>
        <strong>Kernel ID:</strong> {kernelId}
      </Text>
      <Text as="p" sx={{ mb: 1 }}>
        <strong>Notebook Count:</strong> {notebookCount}
      </Text>
      <Text as="p">
        <strong>Active Cells:</strong> {activeCells}
      </Text>
    </Box>
  );
};

/**
 * Interactive example showing real-time state updates
 */
const InteractiveStateExample: React.FC = () => {
  const [code, setCode] = useState('print("Hello from state management!")');
  const [outputId] = useState('state-example-output');

  const handleExecute = () => {
    // Update state to track execution
    const state = jupyterReactStore.getState();
    const outputs = state.outputStore?.outputs || {};
    const updatedOutputs = {
      ...outputs,
      [outputId]: {
        id: outputId,
        outputs: [{
          output_type: 'stream',
          name: 'stdout',
          text: `Executed: ${code}\n`
        }],
        timestamp: new Date().toISOString()
      }
    };
    // Update via the outputStore
    if (state.outputStore) {
      state.outputStore.outputs = updatedOutputs;
    }
  };

  return (
    <Box>
      <Text as="p" sx={{ mb: 2 }}>
        Type code and execute to see state updates:
      </Text>
      <TextInput 
        value={code}
        onChange={(e) => setCode(e.target.value)}
        sx={{ mb: 2, fontFamily: 'mono' }}
        placeholder="Enter Python code..."
      />
      <Button onClick={handleExecute} sx={{ mb: 2 }}>
        Execute & Update State
      </Button>
      
      <Box sx={{ mt: 2 }}>
        <Text as="p" sx={{ fontSize: 1, color: 'fg.subtle', mb: 1 }}>
          Output stored in state:
        </Text>
        <OutputStateDisplay outputId={outputId} />
      </Box>
    </Box>
  );
};

/**
 * Display output from state
 */
const OutputStateDisplay: React.FC<{ outputId: string }> = ({ outputId }) => {
  const [output, setOutput] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = jupyterReactStore.subscribe(
      state => {
        const outputs = state.outputStore?.outputs;
        if (outputs instanceof Map) {
          const outputData = outputs.get(outputId);
          setOutput(outputData);
        }
      }
    );

    return unsubscribe;
  }, [outputId]);

  if (!output) {
    return <Text sx={{ fontStyle: 'italic', color: 'fg.subtle' }}>No output yet</Text>;
  }

  return (
    <Box sx={{ fontFamily: 'mono', fontSize: 1, p: 2, bg: 'canvas.subtle', borderRadius: 1 }}>
      <pre>{JSON.stringify(output, null, 2)}</pre>
    </Box>
  );
};

export default GenericStateManagementExample;