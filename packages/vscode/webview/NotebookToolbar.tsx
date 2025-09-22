/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module NotebookToolbar
 * VS Code-style toolbar for the Jupyter notebook
 */

import React, { useState, useEffect } from 'react';
import useNotebookStore from '@datalayer/jupyter-react/lib/components/notebook/NotebookState';

/**
 * Props for the NotebookToolbar component
 * @hidden
 */
interface NotebookToolbarProps {
  /** ID of the notebook */
  notebookId: string;
  /** Whether this is a Datalayer cloud notebook */
  isDatalayerNotebook?: boolean;
}

/**
 * Toolbar component for Jupyter notebook operations
 */
export const NotebookToolbar: React.FC<NotebookToolbarProps> = ({
  notebookId,
  isDatalayerNotebook = false,
}) => {
  const notebookStore = useNotebookStore();
  const notebook = notebookStore.selectNotebook(notebookId);
  const [selectedKernel, setSelectedKernel] = useState<string>('No Kernel');
  const [kernelStatus, setKernelStatus] = useState<string>('disconnected');

  useEffect(() => {
    if (notebook?.adapter?.kernel) {
      const kernel = notebook.adapter.kernel;
      const kernelName = kernel.name || 'Unknown Kernel';
      setSelectedKernel(kernelName);
      setKernelStatus(kernel.status || 'idle');
    }
  }, [notebook]);

  const handleRunCell = () => {
    if (notebook?.adapter?.commands) {
      notebook.adapter.commands.execute('notebook:run-cell');
    }
  };

  const handleRunAllAbove = () => {
    if (notebook?.adapter?.commands) {
      notebook.adapter.commands.execute('notebook:run-all-above');
    }
  };

  const handleRunAllBelow = () => {
    if (notebook?.adapter?.commands) {
      notebook.adapter.commands.execute('notebook:run-all-below');
    }
  };

  const handleInsertCellAbove = () => {
    if (notebook?.adapter?.commands) {
      notebook.adapter.commands.execute('notebook:insert-cell-above');
    }
  };

  const handleInsertCellBelow = () => {
    if (notebook?.adapter?.commands) {
      notebook.adapter.commands.execute('notebook:insert-cell-below');
    }
  };

  const handleClearOutputs = () => {
    if (notebook?.adapter?.commands) {
      notebook.adapter.commands.execute('notebook:clear-all-cell-outputs');
    }
  };

  const handleRestartKernel = () => {
    if (notebook?.adapter?.commands) {
      notebook.adapter.commands.execute('kernelmenu:restart');
    }
  };

  const handleInterruptKernel = () => {
    if (notebook?.adapter?.commands) {
      notebook.adapter.commands.execute('kernelmenu:interrupt');
    }
  };

  const getKernelStatusIcon = () => {
    switch (kernelStatus) {
      case 'idle':
        return 'codicon-circle-filled';
      case 'busy':
        return 'codicon-loading codicon-modifier-spin';
      case 'disconnected':
        return 'codicon-circle-slash';
      default:
        return 'codicon-circle-outline';
    }
  };

  const getKernelStatusColor = () => {
    switch (kernelStatus) {
      case 'idle':
        return 'var(--vscode-terminal-ansiGreen)';
      case 'busy':
        return 'var(--vscode-terminal-ansiYellow)';
      case 'disconnected':
        return 'var(--vscode-errorForeground)';
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
        {/* Run Cell */}
        <button
          onClick={handleRunCell}
          title="Run Cell"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span className="codicon codicon-run"></span>
        </button>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '18px',
            backgroundColor: 'var(--vscode-widget-border)',
            margin: '0 4px',
          }}
        />

        {/* Run All Cells Above */}
        <button
          onClick={handleRunAllAbove}
          title="Run All Cells Above"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span className="codicon codicon-run-above"></span>
        </button>

        {/* Run All Cells Below */}
        <button
          onClick={handleRunAllBelow}
          title="Run All Cells Below"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span className="codicon codicon-run-below"></span>
        </button>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '18px',
            backgroundColor: 'var(--vscode-widget-border)',
            margin: '0 4px',
          }}
        />

        {/* Insert Cell Above */}
        <button
          onClick={handleInsertCellAbove}
          title="Insert Cell Above"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span className="codicon codicon-add"></span>
        </button>

        {/* Insert Cell Below */}
        <button
          onClick={handleInsertCellBelow}
          title="Insert Cell Below"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span className="codicon codicon-add"></span>
        </button>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '18px',
            backgroundColor: 'var(--vscode-widget-border)',
            margin: '0 4px',
          }}
        />

        {/* Clear Outputs */}
        <button
          onClick={handleClearOutputs}
          title="Clear All Outputs"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span className="codicon codicon-clear-all"></span>
        </button>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '18px',
            backgroundColor: 'var(--vscode-widget-border)',
            margin: '0 4px',
          }}
        />

        {/* Restart Kernel */}
        <button
          onClick={handleRestartKernel}
          title="Restart Kernel"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span className="codicon codicon-debug-restart"></span>
        </button>

        {/* Interrupt Kernel */}
        <button
          onClick={handleInterruptKernel}
          title="Interrupt Kernel"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '16px',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor =
              'var(--vscode-toolbar-hoverBackground)')
          }
          onMouseLeave={e =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
        >
          <span className="codicon codicon-debug-stop"></span>
        </button>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '18px',
            backgroundColor: 'var(--vscode-widget-border)',
            margin: '0 4px',
          }}
        />

        {/* Debug Button */}
        <button
          onClick={() => {
            console.log(
              '=== DEBUG: Searching for black background elements ===',
            );
            const all = document.querySelectorAll('*');
            const results: any[] = [];

            all.forEach((el: Element) => {
              const style = getComputedStyle(el);
              const bg = style.backgroundColor;

              // Check for black or near-black backgrounds
              if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                  const [_, r, g, b] = match;
                  if (
                    parseInt(r) < 50 &&
                    parseInt(g) < 50 &&
                    parseInt(b) < 50
                  ) {
                    results.push({
                      element: el,
                      tag: el.tagName,
                      id: el.id,
                      classes: el.className,
                      backgroundColor: bg,
                      parent: el.parentElement?.tagName,
                      parentId: el.parentElement?.id,
                      parentClasses: el.parentElement?.className,
                    });
                  }
                }
              }
            });

            console.log('Dark elements found:', results.length);
            results.forEach(r => {
              console.log(
                `${r.tag}#${r.id || 'no-id'}.${r.classes || 'no-class'} = ${r.backgroundColor}`,
              );
              console.log(
                '  Parent:',
                `${r.parent}#${r.parentId || 'no-id'}.${r.parentClasses || 'no-class'}`,
              );
            });

            // Also log the specific containers to identify the source
            console.log('\n=== Root Elements ===');
            console.log(
              'document.documentElement (html) background:',
              getComputedStyle(document.documentElement).backgroundColor,
            );
            console.log(
              'document.body background:',
              getComputedStyle(document.body).backgroundColor,
            );

            const notebookEditor = document.getElementById('notebook-editor');
            if (notebookEditor) {
              console.log(
                'notebook-editor background:',
                getComputedStyle(notebookEditor).backgroundColor,
              );
            }

            console.log('\n=== Notebook Container Elements ===');
            const notebookEl = document.getElementById('dla-Jupyter-Notebook');
            if (notebookEl) {
              console.log(
                'dla-Jupyter-Notebook background:',
                getComputedStyle(notebookEl).backgroundColor,
              );
            }

            const boxNotebook = document.querySelector('.dla-Box-Notebook');
            if (boxNotebook) {
              console.log(
                'dla-Box-Notebook background:',
                getComputedStyle(boxNotebook).backgroundColor,
              );
            }

            const jpNotebook = document.querySelector('.jp-Notebook');
            if (jpNotebook) {
              console.log(
                'jp-Notebook background:',
                getComputedStyle(jpNotebook).backgroundColor,
              );
            }

            const jpNotebookPanel = document.querySelector('.jp-NotebookPanel');
            if (jpNotebookPanel) {
              console.log(
                'jp-NotebookPanel background:',
                getComputedStyle(jpNotebookPanel).backgroundColor,
              );
            }

            // Check Primer components
            const primerBoxes = document.querySelectorAll(
              '.Box-sc-g0xbh4-0, .prc-src-BaseStyles-dl-St',
            );
            console.log('\n=== Primer Components ===');
            primerBoxes.forEach((box, i) => {
              console.log(
                `Primer Box ${i}:`,
                box.className,
                'background:',
                getComputedStyle(box).backgroundColor,
              );
            });

            return results;
          }}
          title="Debug Black Background"
          style={{
            background: 'red',
            border: '2px solid red',
            color: 'white',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.backgroundColor = 'darkred')
          }
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'red')}
        >
          <span className="codicon codicon-bug"></span>
        </button>
      </div>

      {/* Right side - Kernel selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '3px',
            backgroundColor: 'var(--vscode-button-secondaryBackground)',
            cursor: isDatalayerNotebook ? 'default' : 'pointer',
            opacity: isDatalayerNotebook ? 0.6 : 1,
          }}
          title={
            isDatalayerNotebook
              ? 'Kernel managed by Datalayer'
              : 'Select Kernel'
          }
        >
          <span
            className={`codicon ${getKernelStatusIcon()}`}
            style={{
              fontSize: '12px',
              color: getKernelStatusColor(),
            }}
          />
          <span style={{ fontSize: 'var(--vscode-editor-font-size, 13px)' }}>
            {selectedKernel}
          </span>
          {!isDatalayerNotebook && (
            <span
              className="codicon codicon-chevron-down"
              style={{ fontSize: '12px' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotebookToolbar;
