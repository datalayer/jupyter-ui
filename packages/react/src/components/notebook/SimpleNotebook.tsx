/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { ServiceManager } from '@jupyterlab/services';
import { Box } from '@primer/react';
import React, { useEffect } from 'react';
import {
  BaseNotebook,
  useKernelId,
  useNotebookModel,
  type CollaborationServer,
} from './BaseNotebook';
import type { INotebookProps } from './Notebook';
import type { NotebookModel } from '@jupyterlab/notebook';
import type { CommandRegistry } from '@lumino/commands';

import './Notebook.css';

export interface ISimpleNotebookProps
  extends Omit<
    INotebookProps,
    | 'CellSidebar'
    | 'cellSidebarMargin'
    | 'cellMetadataPanel'
    | 'collaborative'
    | 'kernel'
    | 'lite'
    | 'nbgrader'
    | 'serverless'
    | 'useRunningKernelId'
    | 'useRunningKernelIndex'
    | 'kernelClients' // FIXME
    | 'kernelTransfer' // FIXME
  > {
  /**
   * Collaboration server providing the document rooms
   */
  collaborationServer: CollaborationServer;
  /**
   * Custom command registry.
   *
   * Note:
   * Providing it allows to command the component from an higher level.
   */
  commands?: CommandRegistry;
  /**
   * Kernel ID to connect to.
   */
  kernelId?: string;
  /**
   * Jupyter service manager.
   */
  serviceManager: ServiceManager.IManager;
  /**
   * Callback on notebook model changed
   */
  onNotebookModelChanged?: (model: NotebookModel | null) => void;
}

/**
 * Simple notebook component without adapter and stores.
 *
 * Notes:
 * - You must provide the appropriate service manager
 * - You can specified the kernel id to use; if it is not defined or empty and startDefaultKernel is true, a new kernel will be started.
 */
export function SimpleNotebook(
  props: React.PropsWithChildren<ISimpleNotebookProps>
): JSX.Element {
  const {
    Toolbar,
    children,
    collaborationServer,
    commands,
    extensions,
    height = '100vh',
    maxHeight = '100vh',
    id,
    nbformat,
    onNotebookModelChanged,
    onSessionConnection,
    path,
    readonly = false,
    serviceManager,
    startDefaultKernel = false,
    url,
  } = props;

  const kernelId = useKernelId({
    requestedKernelId: props.kernelId,
    kernels: serviceManager.kernels,
    startDefaultKernel,
  });

  const model = useNotebookModel({
    collaborationServer,
    nbformat,
    readonly,
    url,
  });

  useEffect(() => {
    onNotebookModelChanged?.(model);
  }, [model, onNotebookModelChanged]);

  return (
    <Box
      style={{ height, width: '100%', position: 'relative' }}
      id="dla-Jupyter-Notebook"
    >
      {Toolbar && <Toolbar notebookId={id} />}
      <Box
        className="dla-Box-Notebook"
        sx={{
          height,
          maxHeight,
          width: '100%',
          overflowY: 'hidden',
          '& .datalayer-NotebookPanel-header': {
            minHeight: '50px',
          },
          '& .jp-Notebook': {
            flex: '1 1 auto !important',
            height: '100%',
            overflowY: 'scroll',
          },
          '& .jp-NotebookPanel': {
            height: '100% !important',
            width: '100% !important',
          },
          '& .jp-Toolbar': {
            display: 'none',
            zIndex: 0,
          },
          '& .jp-Toolbar .jp-HTMLSelect.jp-DefaultStyle select': {
            fontSize: '14px',
          },
          '& .jp-Toolbar > .jp-Toolbar-responsive-opener': {
            display: 'none',
          },
          '& .jp-Toolbar-kernelName': {
            display: 'none',
          },
          /*
          '& .jp-Cell': {
            width: `calc(100% - ${cellSidebarMargin}px)`,
          },
          '& .jp-Notebook-footer': {
            width: `calc(100% - ${cellSidebarMargin + 82}px)`,
          },
          '& .jp-Cell .jp-CellHeader': {
            position: 'absolute',
            top: '-5px',
            left: `${cellSidebarMargin + 10}px`,
            height: 'auto',
          },
          '& .jp-Cell .dla-CellSidebar-Container': {
            padding: '4px 8px',
            width: `${cellSidebarMargin + 10}px`,
            marginLeft: 'auto',
          },
          */
          '& .jp-CodeMirrorEditor': {
            cursor: 'text !important',
          },
          '.dla-Box-Notebook': {
            position: 'relative',
          },
        }}
      >
        {children}
        {model && serviceManager && (
          <BaseNotebook
            commands={commands}
            id={id}
            extensions={extensions}
            model={model}
            serviceManager={serviceManager}
            kernelId={kernelId}
            onSessionConnectionChanged={onSessionConnection}
            path={path}
          />
        )}
      </Box>
    </Box>
  );
}
