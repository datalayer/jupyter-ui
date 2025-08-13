/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useState } from 'react';
import { Box, Button, Heading, Text } from '@primer/react';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable } from '@lumino/disposable';
import { CommandRegistry } from '@lumino/commands';
import { 
  Jupyter,
  Notebook,
  NotebookExtension,
  INotebookExtensionProps,
  jupyterReactStore,
  useJupyter
} from '../../index';

/**
 * Example custom notebook extension using the generic NotebookExtension type
 */
class CustomNotebookExtension implements NotebookExtension {
  private _panel: NotebookPanel | null = null;
  private _disposables: IDisposable[] = [];
  private _component: JSX.Element | null = null;

  get component(): JSX.Element | null {
    return this._component;
  }

  /**
   * Initialize the extension with notebook properties
   */
  init(props: INotebookExtensionProps): void {
    console.log('CustomNotebookExtension initialized with props:', props);
    
    // Access the notebook state from the store
    const state = jupyterReactStore.getState();
    console.log('Current notebook state:', state.notebookStore?.notebooks);
  }

  /**
   * Create the extension for a notebook panel
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    this._panel = panel;
    console.log('CustomNotebookExtension attached to notebook:', context.path);

    // Add custom functionality to the notebook
    this.addCellCountBadge();
    this.addExecutionTracker();
    this.addCustomToolbarButton();

    // Return a disposable to clean up when the extension is removed
    return {
      get isDisposed(): boolean {
        return this._panel === null;
      },
      dispose: () => {
        console.log('CustomNotebookExtension disposed');
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
        this._panel = null;
      }
    };
  }

  /**
   * Add a badge showing the number of cells
   */
  private addCellCountBadge(): void {
    if (!this._panel) return;

    const updateBadge = () => {
      const cellCount = this._panel!.content.widgets.length;
      console.log(`Notebook has ${cellCount} cells`);
      
      // Update the state to track cell count
      const notebookId = this._panel!.id;
      
      // You could dispatch an action or update state here
      console.log(`Notebook ${notebookId} cell count:`, cellCount);
    };

    // Update on cell list change
    this._panel.content.model?.cells.changed.connect(updateBadge);
    updateBadge();
  }

  /**
   * Track cell execution
   */
  private addExecutionTracker(): void {
    if (!this._panel) return;

    this._panel.content.widgets.forEach((cell: Cell) => {
      if (cell.model.type === 'code') {
        // Track when cells are executed
        cell.model.contentChanged.connect(() => {
          console.log('Cell content changed:', cell.model.id);
        });
      }
    });
  }

  /**
   * Add a custom toolbar button
   */
  private addCustomToolbarButton(): void {
    if (!this._panel) return;

    // This is a simplified example - in a real extension you'd add to the toolbar
    console.log('Custom toolbar button would be added here');
  }
}

/**
 * Another example extension that adds cell timing
 */
class TimingNotebookExtension implements NotebookExtension {
  private _startTimes = new Map<string, number>();
  private _component: JSX.Element | null = null;

  get component(): JSX.Element | null {
    return this._component;
  }

  init(props: INotebookExtensionProps): void {
    console.log('TimingNotebookExtension initialized');
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    // Track execution timing for each cell
    panel.content.widgets.forEach((cell: Cell) => {
      if (cell.model.type === 'code') {
        // Track execution start
        cell.model.contentChanged.connect(() => {
          this._startTimes.set(cell.model.id, Date.now());
        });

        // Track execution complete
        cell.model.stateChanged.connect((_, change) => {
          if (change.name === 'executionCount' && change.newValue) {
            const startTime = this._startTimes.get(cell.model.id);
            if (startTime) {
              const duration = Date.now() - startTime;
              console.log(`Cell ${cell.model.id} executed in ${duration}ms`);
              this._startTimes.delete(cell.model.id);
            }
          }
        });
      }
    });

    return {
      get isDisposed(): boolean {
        return this._startTimes.size === 0;
      },
      dispose: () => {
        this._startTimes.clear();
        console.log('TimingNotebookExtension disposed');
      }
    };
  }
}

/**
 * Component demonstrating generic notebook extensions
 */
export const GenericNotebookExtensionExample: React.FC = () => {
  const [extensionsEnabled, setExtensionsEnabled] = useState(true);
  const { kernel, serviceManager } = useJupyter();

  // Create extension instances
  const customExtension = new CustomNotebookExtension();
  const timingExtension = new TimingNotebookExtension();

  // Initialize extensions
  React.useEffect(() => {
    if (extensionsEnabled) {
      customExtension.init({ 
        notebookId: 'example-notebook',
        commands: new CommandRegistry(),
        panel: {} as any
      });
      timingExtension.init({
        notebookId: 'example-notebook',
        commands: new CommandRegistry(),
        panel: {} as any
      });
    }
  }, [extensionsEnabled]);

  return (
    <Box p={4}>
      <Heading sx={{ mb: 3 }}>Generic Notebook Extensions Example</Heading>

      {/* Extension Control */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Extension Management</Heading>
        <Text as="p" sx={{ mb: 2 }}>
          Extensions provide custom functionality to notebooks without modifying the core components.
        </Text>
        <Button 
          onClick={() => setExtensionsEnabled(!extensionsEnabled)}
          variant={extensionsEnabled ? 'primary' : 'default'}
        >
          Extensions: {extensionsEnabled ? 'Enabled' : 'Disabled'}
        </Button>
      </Box>

      {/* Extension Information */}
      <Box sx={{ mb: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Active Extensions</Heading>
        <Box as="ul" sx={{ pl: 3 }}>
          <Text as="li" sx={{ mb: 1 }}>
            <strong>CustomNotebookExtension</strong>: Adds cell count tracking, execution monitoring, and custom toolbar
          </Text>
          <Text as="li" sx={{ mb: 1 }}>
            <strong>TimingNotebookExtension</strong>: Tracks and logs cell execution timing
          </Text>
        </Box>
        <Text as="p" sx={{ mt: 2, fontSize: 1, color: 'fg.subtle' }}>
          Check the browser console to see extension logs
        </Text>
      </Box>

      {/* Notebook with Extensions */}
      <Jupyter
        jupyterServerUrl="http://localhost:8888"
        jupyterServerToken="test-token"
        serviceManager={serviceManager}
      >
        <Box sx={{ border: '1px solid', borderColor: 'border.default', borderRadius: 2, p: 3 }}>
          <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>
            Notebook with Generic Extensions
          </Heading>
          
          <Notebook
            path="extension-example.ipynb"
            id="example-notebook"
            extensions={extensionsEnabled ? [customExtension, timingExtension] : []}
            height="500px"
            kernel={kernel}
            serviceManager={serviceManager}
            cellSidebarMargin={120}
          />
        </Box>
      </Jupyter>

      {/* Extension Development Guide */}
      <Box sx={{ mt: 3, p: 3, border: '1px solid', borderColor: 'border.default', borderRadius: 2 }}>
        <Heading as="h3" sx={{ fontSize: 2, mb: 2 }}>Creating Custom Extensions</Heading>
        <Text as="p" sx={{ mb: 2 }}>
          To create a custom notebook extension:
        </Text>
        <Box as="ol" sx={{ pl: 3 }}>
          <Text as="li" sx={{ mb: 1 }}>
            Implement the <code>NotebookExtension</code> interface
          </Text>
          <Text as="li" sx={{ mb: 1 }}>
            Define <code>init(props: INotebookExtensionProps)</code> for initialization
          </Text>
          <Text as="li" sx={{ mb: 1 }}>
            Implement <code>createNew(panel, context)</code> to attach to notebooks
          </Text>
          <Text as="li" sx={{ mb: 1 }}>
            Return an <code>IDisposable</code> for cleanup
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export default GenericNotebookExtensionExample;