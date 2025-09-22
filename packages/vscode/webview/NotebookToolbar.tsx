/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module NotebookToolbar
 * VS Code-style toolbar for the Jupyter notebook
 */

import React, { useState, useEffect, useContext } from 'react';
import useNotebookStore from '@datalayer/jupyter-react/lib/components/notebook/NotebookState';
import { MessageHandlerContext } from './messageHandler';

/** Runtime information for Datalayer notebooks */
interface RuntimeInfo {
  uid: string;
  name: string;
  status?: string;
  url?: string;
  token?: string;
  environment?: string;
  creditsUsed?: number;
  creditsLimit?: number;
}

/**
 * Props for the NotebookToolbar component
 * @hidden
 */
interface NotebookToolbarProps {
  /** ID of the notebook */
  notebookId: string;
  /** Whether this is a Datalayer cloud notebook */
  isDatalayerNotebook?: boolean;
  /** Selected runtime information for Datalayer notebooks */
  selectedRuntime?: RuntimeInfo;
}

/**
 * Toolbar component for Jupyter notebook operations
 */
export const NotebookToolbar: React.FC<NotebookToolbarProps> = ({
  notebookId,
  isDatalayerNotebook = false,
  selectedRuntime,
}) => {
  const notebookStore = useNotebookStore();
  const notebook = notebookStore.selectNotebook(notebookId);
  const messageHandler = useContext(MessageHandlerContext);
  const [selectedKernel, setSelectedKernel] = useState<string>('No Kernel');
  const [kernelStatus, setKernelStatus] = useState<string>('disconnected');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  useEffect(() => {
    console.log('[NotebookToolbar] useEffect triggered with:', {
      isDatalayerNotebook,
      selectedRuntime,
      hasKernelConnection: !!notebook?.adapter?.kernel?.connection,
    });

    // For Datalayer notebooks, always show the runtime name
    if (isDatalayerNotebook && selectedRuntime) {
      // Format as "Datalayer: Runtime Name"
      const runtimeName = selectedRuntime.name || 'Select Runtime';
      const displayName = `Datalayer: ${runtimeName}`;
      setSelectedKernel(displayName);
      console.log('[NotebookToolbar] Updated kernel display to:', displayName);

      // Check if we have an active kernel connection to determine status
      if (notebook?.adapter?.kernel?.connection) {
        const kernelConnection = notebook.adapter.kernel.connection;
        setKernelStatus(kernelConnection.status || 'idle');
        setIsConnecting(false);
      } else if (selectedRuntime.status === 'connecting') {
        setKernelStatus('connecting');
        setIsConnecting(true);
      } else {
        setKernelStatus(selectedRuntime.status || 'disconnected');
        setIsConnecting(false);
      }
    } else if (!isDatalayerNotebook && notebook?.adapter?.kernel?.connection) {
      // For local notebooks, show kernel info
      const kernelConnection = notebook.adapter.kernel.connection;
      const displayName = kernelConnection.name || 'Unknown Kernel';
      setSelectedKernel(displayName);
      setKernelStatus(kernelConnection.status || 'idle');
      setIsConnecting(false);
    } else {
      // Show "No Kernel" when nothing is selected
      setSelectedKernel(isDatalayerNotebook ? 'Select Runtime' : 'No Kernel');
      setKernelStatus('disconnected');
      setIsConnecting(false);
      console.log(
        '[NotebookToolbar] No runtime selected, isDatalayerNotebook:',
        isDatalayerNotebook,
      );
    }
  }, [notebook, isDatalayerNotebook, selectedRuntime]);

  const handleRunAll = () => {
    if (notebook?.adapter) {
      // Use the notebook panel to run all cells
      const notebookPanel = notebook.adapter.notebookPanel;
      if (notebookPanel?.content) {
        // Execute all cells in the notebook
        const cells = notebookPanel.content.widgets;
        cells.forEach(cell => {
          if (cell.model.type === 'code') {
            notebookPanel.content.activeCellIndex =
              notebookPanel.content.widgets.indexOf(cell);
            notebook.adapter.commands.execute('notebook:run-cell');
          }
        });
      }
    }
  };

  const handleSelectRuntime = () => {
    if (messageHandler) {
      // Send message to extension to show runtime selection dialog
      messageHandler.postMessage({
        type: 'select-runtime',
        body: {
          isDatalayerNotebook: isDatalayerNotebook,
        },
      });
    }
  };

  const getKernelStatusIcon = () => {
    if (isConnecting) {
      return 'codicon-loading codicon-modifier-spin';
    }
    switch (kernelStatus) {
      case 'idle':
        return 'codicon-circle-filled';
      case 'busy':
        return 'codicon-loading codicon-modifier-spin';
      case 'disconnected':
        return 'codicon-circle-slash';
      case 'connecting':
        return 'codicon-loading codicon-modifier-spin';
      default:
        return 'codicon-circle-outline';
    }
  };

  const getKernelStatusColor = () => {
    if (isConnecting) {
      return 'var(--vscode-terminal-ansiYellow)';
    }
    switch (kernelStatus) {
      case 'idle':
        return 'var(--vscode-terminal-ansiGreen)';
      case 'busy':
        return 'var(--vscode-terminal-ansiYellow)';
      case 'disconnected':
        return 'var(--vscode-errorForeground)';
      case 'connecting':
        return 'var(--vscode-terminal-ansiYellow)';
      default:
        return 'var(--vscode-foreground)';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
        backgroundColor: 'var(--vscode-editor-background)',
        borderBottom:
          '1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border))',
        fontSize: 'var(--vscode-editor-font-size, 13px)',
        fontFamily: 'var(--vscode-font-family)',
        minHeight: '30px',
      }}
    >
      {/* Left side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {/* Run All button */}
        <button
          onClick={handleRunAll}
          title="Run All Cells"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span
            className="codicon codicon-run-all"
            style={{ fontSize: '16px' }}
          ></span>
          <span>Run All</span>
        </button>
      </div>

      {/* Right side - Kernel selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: '3px',
            backgroundColor:
              kernelStatus === 'disconnected'
                ? 'var(--vscode-button-secondaryBackground)'
                : 'transparent',
            border:
              '1px solid var(--vscode-button-border, var(--vscode-contrastBorder, transparent))',
            cursor:
              kernelStatus === 'disconnected' || !notebook?.adapter?.kernel
                ? 'pointer'
                : 'default',
            color: 'var(--vscode-foreground)',
            fontSize: 'var(--vscode-editor-font-size, 13px)',
            fontFamily: 'var(--vscode-font-family)',
            minWidth: '120px',
            transition: 'background-color 0.1s ease',
          }}
          onClick={
            kernelStatus === 'disconnected' || !notebook?.adapter?.kernel
              ? handleSelectRuntime
              : undefined
          }
          title={
            notebook?.adapter?.kernel
              ? `Connected to ${selectedKernel}`
              : isDatalayerNotebook
                ? 'Select Datalayer Runtime'
                : 'Select Kernel'
          }
          onMouseEnter={e => {
            if (kernelStatus === 'disconnected' || !notebook?.adapter?.kernel) {
              e.currentTarget.style.backgroundColor =
                'var(--vscode-button-secondaryHoverBackground)';
            }
          }}
          onMouseLeave={e => {
            if (kernelStatus === 'disconnected' || !notebook?.adapter?.kernel) {
              e.currentTarget.style.backgroundColor =
                'var(--vscode-button-secondaryBackground)';
            } else {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span
            className={`codicon ${getKernelStatusIcon()}`}
            style={{
              fontSize: '12px',
              color: getKernelStatusColor(),
              minWidth: '12px',
            }}
          />
          <span
            style={{
              flex: 1,
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedKernel}
          </span>
          {/* Never show chevron - this is not a dropdown */}
        </button>
      </div>
    </div>
  );
};

export default NotebookToolbar;
