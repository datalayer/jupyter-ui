/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useEffect, useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import type { INotebookContent } from '@jupyterlab/nbformat';
import type { NotebookModel } from '@jupyterlab/notebook';
import type { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import type { ServiceManager } from '@jupyterlab/services';
import type { CommandRegistry } from '@lumino/commands';
import { Box } from '@datalayer/primer-addons';
import type { OnSessionConnection } from '../../state';
import { Loader } from '../utils';
import { useKernelId, useNotebookModel, Notebook2Base } from './Notebook2Base';
import type { NotebookExtension } from './NotebookExtensions';
import type { INotebookToolbarProps } from './toolbar';
import { ICollaborationProvider } from '../../jupyter';
import type { IInlineCompletionProvider } from '@jupyterlab/completer';

import './Notebook.css';

const GlobalStyle = createGlobalStyle<any>`
  .dla-Box-Notebook .jp-Cell .dla-CellSidebar-Container {
    display: none;
  }
  .dla-Box-Notebook .jp-Cell.jp-mod-active .dla-CellSidebar-Container {
    display: block;
  }
`;

/**
 * Simple notebook component properties
 */
export interface INotebook2Props {
  /**
   * Collaboration provider instance.
   */
  collaborationProvider?: ICollaborationProvider;
  /**
   * Custom command registry.
   *
   * Note:
   * Providing it allows to command the component from an higher level.
   */
  commands?: CommandRegistry;
  /**
   * Notebook extensions.
   */
  extensions?: NotebookExtension[];
  /**
   * Notebook ID.
   */
  id: string;
  /**
   * Kernel ID to connect to.
   */
  kernelId?: string;
  /**
   * Notebook initial content.
   */
  nbformat?: INotebookContent;
  /**
   * Notebook file path.
   */
  path?: string;
  /**
   * Whether the notebook is read-only or not.
   */
  readonly?: boolean;
  /**
   * Additional cell output renderers.
   */
  renderers?: IRenderMime.IRendererFactory[];
  /**
   * Jupyter service manager.
   */
  serviceManager: ServiceManager.IManager;
  /**
   * Whether to start a default kernel or not.
   */
  startDefaultKernel?: boolean;
  /**
   * React toolbar component factory.
   */
  Toolbar?: React.JSXElementConstructor<INotebookToolbarProps>;
  /**
   * URL to fetch the notebook content from.
   */
  url?: string;
  /**
   * Margin in pixels on the right side of cells.
   *
   * This is typically needed when cell sidebar is injected as extension.
   */
  cellSidebarMargin?: number;
  /**
   * CSS height of the component.
   */
  height?: string;
  /**
   * CSS max-height of the component.
   */
  maxHeight?: string;
  /**
   * Callback on notebook model changed.
   */
  onNotebookModelChanged?: (model: NotebookModel | null) => void;
  /**
   * Callback on session connection changed.
   */
  onSessionConnection?: OnSessionConnection;
  /**
   * Custom inline completion providers.
   *
   * Platform-specific providers can be injected here (e.g., VS Code LLM, custom AI models).
   */
  inlineProviders?: IInlineCompletionProvider[];
}

/**
 * Simple notebook component without adapter and stores.
 *
 * Notes:
 * - You must provide the appropriate service manager
 * - You can specify the kernel id to use; if it is not defined or empty and startDefaultKernel is true, a new kernel will be started.
 */
export function Notebook2(
  props: React.PropsWithChildren<INotebook2Props>
): JSX.Element {
  const {
    Toolbar,
    children,
    cellSidebarMargin = 120,
    collaborationProvider,
    commands,
    extensions,
    height = '100vh',
    maxHeight = '100vh',
    id,
    inlineProviders,
    nbformat,
    onNotebookModelChanged,
    onSessionConnection,
    path,
    readonly = false,
    renderers,
    serviceManager,
    startDefaultKernel = false,
    url,
  } = props;

  const [isLoading, setIsLoading] = useState(true);

  const kernelId = useKernelId({
    requestedKernelId: props.kernelId,
    kernels: serviceManager.kernels,
    startDefaultKernel,
  });

  const model = useNotebookModel({
    collaborationProvider,
    nbformat,
    readonly,
    url,
    path,
    serviceManager,
    id,
  });

  useEffect(() => {
    console.log('[Notebook2] useEffect - model changed:', {
      model: !!model,
      isLoading,
    });
    if (model) {
      console.log('[Notebook2] Setting isLoading to false');
      setIsLoading(false);
    }
    onNotebookModelChanged?.(model);
  }, [model, onNotebookModelChanged]);

  useEffect(() => {
    // Set user identity if collaborating using Jupyter collaboration
    const setUserIdentity = () => {
      if (collaborationProvider && model) {
        // Yjs details are hidden from the interface
        (model.sharedModel as any).awareness.setLocalStateField(
          'user',
          serviceManager.user.identity
        );
      }
    };
    setUserIdentity();
    serviceManager.user.userChanged.connect(setUserIdentity);
    return () => {
      serviceManager.user.userChanged.disconnect(setUserIdentity);
    };
  }, [collaborationProvider, model, serviceManager]);

  console.log('[Notebook2] Rendering:', {
    isLoading,
    hasModel: !!model,
    hasServiceManager: !!serviceManager,
    hasInlineProviders: !!inlineProviders,
  });

  return isLoading ? (
    <Loader key="notebook-loader" />
  ) : (
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
            //            height: '100% !important',
            //            width: '100% !important',
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
          '& .jp-Cell': {
            width: `calc(100% - ${cellSidebarMargin}px)`,
          },
          '& .jp-Notebook-footer': {
            width: `calc(100% - ${cellSidebarMargin + 82}px)`,
          },
          '& .jp-CodeMirrorEditor': {
            cursor: 'text !important',
          },
          '.dla-Box-Notebook': {
            position: 'relative',
          },
        }}
      >
        {children}
        <GlobalStyle />
        {model && serviceManager && (
          <Notebook2Base
            commands={commands}
            id={id}
            extensions={extensions}
            inlineProviders={inlineProviders}
            kernelId={kernelId}
            model={model}
            path={path}
            renderers={renderers}
            serviceManager={serviceManager}
            onSessionConnection={onSessionConnection}
          />
        )}
      </Box>
    </Box>
  );
}
