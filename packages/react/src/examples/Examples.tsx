/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Examples - A runtime example picker for Jupyter React.
 *
 * This module provides a dynamic example selector that:
 * 1. Reads the example from URL query parameter (?example=CellLite)
 * 2. Falls back to localStorage if no query param
 * 3. Falls back to default (CellLite) if nothing stored
 * 4. Dynamically imports and executes the selected example
 *
 * The selector UI uses Primer React components and persists selection.
 */

import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ThemeProvider,
  BaseStyles,
  Text,
  Spinner,
  Flash,
  ActionList,
  TextInput,
} from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { SearchIcon, CheckIcon } from '@primer/octicons-react';

const LOCAL_STORAGE_KEY = 'jupyter-react-selected-example';

/**
 * Available examples with their display names and module paths.
 * Only includes examples that actually exist in the examples directory.
 */
const EXAMPLES: Array<{ name: string; path: string }> = [
  { name: 'Cell', path: 'Cell' },
  { name: 'Cell Lite', path: 'CellLite' },
  { name: 'Cells', path: 'Cells' },
  { name: 'Cells Execute', path: 'CellsExecute' },
  { name: 'Console', path: 'Console' },
  { name: 'Console Lite', path: 'ConsoleLite' },
  { name: 'File Browser', path: 'FileBrowser' },
  { name: 'IPyLeaflet', path: 'IPyLeaflet' },
  { name: 'IPyReact', path: 'IPyReact' },
  { name: 'IPyWidgets', path: 'IPyWidgets' },
  { name: 'IPyWidgets State', path: 'IPyWidgetsState' },
  { name: 'Jupyter Context', path: 'JupyterContext' },
  { name: 'JupyterLab App', path: 'JupyterLabApp' },
  { name: 'JupyterLab App Headless', path: 'JupyterLabAppHeadless' },
  {
    name: 'JupyterLab App Headless Serverless',
    path: 'JupyterLabAppHeadlessServerless',
  },
  { name: 'JupyterLab App Serverless', path: 'JupyterLabAppServerless' },
  {
    name: 'JupyterLab App Service Manager',
    path: 'JupyterLabAppServiceManager',
  },
  { name: 'JupyterLab Theme', path: 'JupyterLabTheme' },
  { name: 'Kernel Execute', path: 'KernelExecute' },
  { name: 'Kernel Execute Lite', path: 'KernelExecuteLite' },
  { name: 'Kernel Executor', path: 'KernelExecutor' },
  { name: 'Kernel Executor Lite', path: 'KernelExecutorLite' },
  { name: 'Kernels', path: 'Kernels' },
  { name: 'Lumino', path: 'Lumino' },
  { name: 'Matplotlib', path: 'Matplotlib' },
  { name: 'Notebook', path: 'Notebook' },
  { name: 'Notebook2', path: 'Notebook2' },
  { name: 'Notebook2 Actions', path: 'Notebook2Actions' },
  { name: 'Notebook2 Collaborative', path: 'Notebook2Collaborative' },
  { name: 'Notebook2 Lite', path: 'Notebook2Lite' },
  { name: 'Notebook Cell Sidebar', path: 'NotebookCellSidebar' },
  { name: 'Notebook Cell Toolbar', path: 'NotebookCellToolbar' },
  { name: 'Notebook Colormode', path: 'NotebookColormode' },
  { name: 'Notebook Collaborative', path: 'NotebookCollaborative' },
  { name: 'Notebook Extension', path: 'NotebookExtension' },
  { name: 'Notebook External Content', path: 'NotebookExternalContent' },
  { name: 'Notebook Init', path: 'NotebookInit' },
  { name: 'Notebook Kernel', path: 'NotebookKernel' },
  { name: 'Notebook Kernel Change', path: 'NotebookKernelChange' },
  { name: 'Notebook Less', path: 'NotebookLess' },
  { name: 'Notebook Lite', path: 'NotebookLite' },
  { name: 'Notebook Lite Context', path: 'NotebookLiteContext' },
  { name: 'Notebook Local Server', path: 'NotebookLocalServer' },
  { name: 'Notebook Nbformat', path: 'NotebookNbformat' },
  { name: 'Notebook Nbformat Change', path: 'NotebookNbformatChange' },
  { name: 'Notebook No Context', path: 'NotebookNoContext' },
  { name: 'Notebook No Primer', path: 'NotebookNoPrimer' },
  {
    name: 'Notebook On Session Connection',
    path: 'NotebookOnSessionConnection',
  },
  { name: 'Notebook Path', path: 'NotebookPath' },
  { name: 'Notebook Path Change', path: 'NotebookPathChange' },
  { name: 'Notebook Readonly', path: 'NotebookReadonly' },
  { name: 'Notebook Service Manager', path: 'NotebookServiceManager' },
  { name: 'Notebook Skeleton', path: 'NotebookSkeleton' },
  { name: 'Notebook Theme', path: 'NotebookTheme' },
  { name: 'Notebook Theme Colormode', path: 'NotebookThemeColormode' },
  { name: 'Notebook TOC', path: 'NotebookTOC' },
  { name: 'Notebook URL', path: 'NotebookURL' },
  { name: 'Notebook Unmount', path: 'NotebookUnmount' },
  { name: 'Outputs', path: 'Outputs' },
  { name: 'Outputs Ipynb', path: 'OutputsIpynb' },
  { name: 'Output IPyWidgets', path: 'OutputIPyWidgets' },
  { name: 'Output With Monitoring', path: 'OutputWithMonitoring' },
  { name: 'Plotly', path: 'Plotly' },
  { name: 'PyGWalker', path: 'PyGWalker' },
  { name: 'Running Sessions', path: 'RunningSessions' },
  { name: 'Terminal', path: 'Terminal' },
  { name: 'Viewer', path: 'Viewer' },
];

/**
 * Dynamic import function for examples.
 * Uses explicit imports to work with both Vite and webpack bundlers.
 * The examples render to their own DOM elements when imported.
 */
const importExample = (path: string): Promise<unknown> => {
  const modules: Record<string, () => Promise<unknown>> = {
    Cell: () => import('./Cell'),
    CellLite: () => import('./CellLite'),
    Cells: () => import('./Cells'),
    CellsExecute: () => import('./CellsExecute'),
    Console: () => import('./Console'),
    ConsoleLite: () => import('./ConsoleLite'),
    FileBrowser: () => import('./FileBrowser'),
    IPyLeaflet: () => import('./IPyLeaflet'),
    IPyReact: () => import('./IPyReact'),
    IPyWidgets: () => import('./IPyWidgets'),
    IPyWidgetsState: () => import('./IPyWidgetsState'),
    JupyterContext: () => import('./JupyterContext'),
    JupyterLabApp: () => import('./JupyterLabApp'),
    JupyterLabAppHeadless: () => import('./JupyterLabAppHeadless'),
    JupyterLabAppHeadlessServerless: () =>
      import('./JupyterLabAppHeadlessServerless'),
    JupyterLabAppServerless: () => import('./JupyterLabAppServerless'),
    JupyterLabAppServiceManager: () => import('./JupyterLabAppServiceManager'),
    JupyterLabTheme: () => import('./JupyterLabTheme'),
    KernelExecute: () => import('./KernelExecute'),
    KernelExecuteLite: () => import('./KernelExecuteLite'),
    KernelExecutor: () => import('./KernelExecutor'),
    KernelExecutorLite: () => import('./KernelExecutorLite'),
    Kernels: () => import('./Kernels'),
    Lumino: () => import('./Lumino'),
    Matplotlib: () => import('./Matplotlib'),
    Notebook: () => import('./Notebook'),
    Notebook2: () => import('./Notebook2'),
    Notebook2Actions: () => import('./Notebook2Actions'),
    Notebook2Collaborative: () => import('./Notebook2Collaborative'),
    Notebook2Lite: () => import('./Notebook2Lite'),
    NotebookCellSidebar: () => import('./NotebookCellSidebar'),
    NotebookCellToolbar: () => import('./NotebookCellToolbar'),
    NotebookColormode: () => import('./NotebookColormode'),
    NotebookCollaborative: () => import('./NotebookCollaborative'),
    NotebookExtension: () => import('./NotebookExtension'),
    NotebookExternalContent: () => import('./NotebookExternalContent'),
    NotebookInit: () => import('./NotebookInit'),
    NotebookKernel: () => import('./NotebookKernel'),
    NotebookKernelChange: () => import('./NotebookKernelChange'),
    NotebookLess: () => import('./NotebookLess'),
    NotebookLite: () => import('./NotebookLite'),
    NotebookLiteContext: () => import('./NotebookLiteContext'),
    NotebookLocalServer: () => import('./NotebookLocalServer'),
    NotebookNbformat: () => import('./NotebookNbformat'),
    NotebookNbformatChange: () => import('./NotebookNbformatChange'),
    NotebookNoContext: () => import('./NotebookNoContext'),
    NotebookNoPrimer: () => import('./NotebookNoPrimer'),
    NotebookOnSessionConnection: () => import('./NotebookOnSessionConnection'),
    NotebookPath: () => import('./NotebookPath'),
    NotebookPathChange: () => import('./NotebookPathChange'),
    NotebookReadonly: () => import('./NotebookReadonly'),
    NotebookServiceManager: () => import('./NotebookServiceManager'),
    NotebookSkeleton: () => import('./NotebookSkeleton'),
    NotebookTheme: () => import('./NotebookTheme'),
    NotebookThemeColormode: () => import('./NotebookThemeColormode'),
    NotebookTOC: () => import('./NotebookTOC'),
    NotebookURL: () => import('./NotebookURL'),
    NotebookUnmount: () => import('./NotebookUnmount'),
    Outputs: () => import('./Outputs'),
    OutputsIpynb: () => import('./OutputsIpynb'),
    OutputIPyWidgets: () => import('./OutputIPyWidgets'),
    OutputWithMonitoring: () => import('./OutputWithMonitoring'),
    Plotly: () => import('./Plotly'),
    PyGWalker: () => import('./PyGWalker'),
    RunningSessions: () => import('./RunningSessions'),
    Terminal: () => import('./Terminal'),
    Viewer: () => import('./Viewer'),
  };

  const loader = modules[path];
  if (loader) {
    return loader();
  }
  return Promise.reject(new Error(`Example "${path}" not found`));
};

/**
 * Get the selected example from URL or localStorage.
 */
const getSelectedExample = (): string => {
  // First check URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const exampleFromUrl = urlParams.get('example');
  if (exampleFromUrl && EXAMPLES.some(e => e.path === exampleFromUrl)) {
    return exampleFromUrl;
  }

  // Then check localStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && EXAMPLES.some(e => e.path === saved)) {
      return saved;
    }
  } catch {
    // localStorage not available
  }

  return 'CellLite'; // Default example
};

/**
 * Save the selected example to localStorage.
 */
const saveExample = (path: string): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, path);
  } catch {
    // localStorage not available
  }
};

/**
 * Example Selector Sidebar component.
 * Renders a right sidebar with a filtered list for selecting examples.
 */
const ExamplesSidebar = ({
  selectedPath,
  onSelect,
  isLoading,
  error,
}: {
  selectedPath: string;
  onSelect: (path: string) => void;
  isLoading: boolean;
  error: string | null;
}) => {
  const [filter, setFilter] = useState('');

  // Filter examples based on search text
  const filteredExamples = EXAMPLES.filter(
    example =>
      example.name.toLowerCase().includes(filter.toLowerCase()) ||
      example.path.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '320px',
        backgroundColor: 'canvas.default',
        borderLeft: '1px solid',
        borderColor: 'border.default',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'border.default',
        }}
      >
        <Text as="div" fontWeight="bold" fontSize={2}>
          📓 Jupyter React Examples
        </Text>
        {isLoading && (
          <Box mt={2} display="flex" alignItems="center">
            <Spinner size="small" />
            <Text ml={2} fontSize={1} color="fg.muted">
              Loading...
            </Text>
          </Box>
        )}
      </Box>
      {error && (
        <Box px={3} py={2}>
          <Flash variant="danger">{error}</Flash>
        </Box>
      )}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'border.default',
        }}
      >
        <TextInput
          leadingVisual={SearchIcon}
          placeholder="Filter examples..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          sx={{ width: '100%' }}
          aria-label="Filter examples"
        />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <ActionList selectionVariant="single">
          {filteredExamples.length === 0 ? (
            <ActionList.Item disabled>
              No examples match &ldquo;{filter}&rdquo;
            </ActionList.Item>
          ) : (
            filteredExamples.map(example => {
              const isSelected = example.path === selectedPath;
              return (
                <ActionList.Item
                  key={example.path}
                  selected={isSelected}
                  onSelect={() => onSelect(example.path)}
                >
                  {isSelected && (
                    <ActionList.LeadingVisual>
                      <CheckIcon />
                    </ActionList.LeadingVisual>
                  )}
                  {example.name}
                  <ActionList.Description variant="block">
                    {example.path}
                  </ActionList.Description>
                </ActionList.Item>
              );
            })
          )}
        </ActionList>
      </Box>
    </Box>
  );
};

/**
 * Main Examples component.
 * Renders the sidebar and loads the selected example in an iframe.
 */
const Examples = () => {
  const [selectedPath, setSelectedPath] = useState<string>(getSelectedExample);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Add margin to body to account for sidebar width (medium = 320px)
    document.body.style.marginRight = '320px';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      // Cleanup: remove styles when component unmounts
      document.body.style.marginRight = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Build the iframe URL for the selected example
  const getExampleUrl = (path: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('example', path);
    url.searchParams.set('standalone', 'true');
    return url.toString();
  };

  const handleSelect = (path: string) => {
    if (path === selectedPath) return;

    // Save selection
    saveExample(path);

    // Update URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.set('example', path);
    window.history.pushState({}, '', url.toString());

    // Update state to reload iframe
    setIsLoading(true);
    setError(null);
    setSelectedPath(path);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError(`Failed to load example "${selectedPath}"`);
    setIsLoading(false);
  };

  return (
    <ThemeProvider colorMode="auto">
      <BaseStyles>
        {/* Main content iframe */}
        <iframe
          ref={iframeRef}
          src={getExampleUrl(selectedPath)}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 'calc(100vw - 320px)',
            height: '100vh',
            border: 'none',
          }}
          title={`Example: ${selectedPath}`}
        />
        <ExamplesSidebar
          selectedPath={selectedPath}
          onSelect={handleSelect}
          isLoading={isLoading}
          error={error}
        />
      </BaseStyles>
    </ThemeProvider>
  );
};

// Check if we're in standalone mode (loaded in iframe)
const urlParams = new URLSearchParams(window.location.search);
const isStandalone = urlParams.get('standalone') === 'true';

if (isStandalone) {
  // In standalone mode, just load the example directly
  const examplePath = urlParams.get('example') || 'CellLite';
  importExample(examplePath).catch(err => {
    console.error('Failed to load example:', err);
  });
} else {
  // Normal mode: render the selector with sidebar
  const selectorDiv = document.createElement('div');
  selectorDiv.id = 'example-selector-root';
  document.body.appendChild(selectorDiv);

  const root = createRoot(selectorDiv);
  root.render(<Examples />);
}

export { EXAMPLES, getSelectedExample, saveExample };
export default Examples;
