/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * ExampleSelector - A runtime example picker for Jupyter React.
 *
 * This module provides a dynamic example selector that:
 * 1. Reads the example from URL query parameter (?example=CellLite)
 * 2. Falls back to localStorage if no query param
 * 3. Falls back to default (CellLite) if nothing stored
 * 4. Dynamically imports and executes the selected example
 *
 * The selector UI uses Primer React components and persists selection.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, BaseStyles, ActionMenu, ActionList, Box, Text, Spinner, Flash, TextInput } from '@primer/react';
import { SearchIcon } from '@primer/octicons-react';

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
  { name: 'JupyterLab App Headless Serverless', path: 'JupyterLabAppHeadlessServerless' },
  { name: 'JupyterLab App Serverless', path: 'JupyterLabAppServerless' },
  { name: 'JupyterLab App Service Manager', path: 'JupyterLabAppServiceManager' },
  { name: 'JupyterLab Theme', path: 'JupyterLabTheme' },
  { name: 'Kernel Execute', path: 'KernelExecute' },
  { name: 'Kernel Executor', path: 'KernelExecutor' },
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
  { name: 'Notebook On Session Connection', path: 'NotebookOnSessionConnection' },
  { name: 'Notebook Path', path: 'NotebookPath' },
  { name: 'Notebook Path Change', path: 'NotebookPathChange' },
  { name: 'Notebook Readonly', path: 'NotebookReadonly' },
  { name: 'Notebook Service Manager', path: 'NotebookServiceManager' },
  { name: 'Notebook Skeleton', path: 'NotebookSkeleton' },
  { name: 'Notebook Theme', path: 'NotebookTheme' },
  { name: 'Notebook Theme Colormode', path: 'NotebookThemeColormode' },
  { name: 'Notebook Toc', path: 'NotebookToc' },
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
    JupyterLabAppHeadlessServerless: () => import('./JupyterLabAppHeadlessServerless'),
    JupyterLabAppServerless: () => import('./JupyterLabAppServerless'),
    JupyterLabAppServiceManager: () => import('./JupyterLabAppServiceManager'),
    JupyterLabTheme: () => import('./JupyterLabTheme'),
    KernelExecute: () => import('./KernelExecute'),
    KernelExecutor: () => import('./KernelExecutor'),
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
    NotebookToc: () => import('./NotebookToc'),
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
 * Example Selector Header component.
 * Renders a sticky header with a filtered search dropdown for selecting examples.
 */
const ExampleSelectorHeader = ({
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
  const selectedExample = EXAMPLES.find(e => e.path === selectedPath) || EXAMPLES[0];
  const [filterText, setFilterText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter examples based on search text
  const filteredExamples = useMemo(() => {
    if (!filterText) return EXAMPLES;
    const lower = filterText.toLowerCase();
    return EXAMPLES.filter(
      e => e.name.toLowerCase().includes(lower) || e.path.toLowerCase().includes(lower)
    );
  }, [filterText]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure the overlay is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Clear filter when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setFilterText('');
    }
  }, [isOpen]);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'canvas.default',
        borderBottom: '1px solid',
        borderColor: 'border.default',
        px: 3,
        py: 2,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Text as="span" fontWeight="bold" mr={3}>
            📓 Jupyter React
          </Text>
          {/* FilteredSearch pattern: ActionMenu + TextInput */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
            }}
          >
            <ActionMenu open={isOpen} onOpenChange={setIsOpen}>
              <ActionMenu.Button
                disabled={isLoading}
                sx={{
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: 0,
                }}
              >
                {selectedExample.name}
              </ActionMenu.Button>
              <ActionMenu.Overlay width="medium">
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'border.default' }}>
                  <TextInput
                    ref={inputRef}
                    leadingVisual={SearchIcon}
                    placeholder="Filter examples..."
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    sx={{ width: '100%' }}
                    aria-label="Filter examples"
                  />
                </Box>
                <ActionList selectionVariant="single" sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredExamples.length === 0 ? (
                    <ActionList.Item disabled>
                      No examples match &ldquo;{filterText}&rdquo;
                    </ActionList.Item>
                  ) : (
                    filteredExamples.map(example => (
                      <ActionList.Item
                        key={example.path}
                        selected={example.path === selectedPath}
                        onSelect={() => {
                          onSelect(example.path);
                          setIsOpen(false);
                        }}
                      >
                        <ActionList.LeadingVisual>
                          <Text sx={{ fontFamily: 'mono', fontSize: 0, color: 'fg.muted' }}>
                            {example.path.substring(0, 2)}
                          </Text>
                        </ActionList.LeadingVisual>
                        {example.name}
                        <ActionList.Description variant="block">
                          {example.path}
                        </ActionList.Description>
                      </ActionList.Item>
                    ))
                  )}
                </ActionList>
              </ActionMenu.Overlay>
            </ActionMenu>
            <TextInput
              leadingVisual={SearchIcon}
              placeholder="Search examples..."
              value={filterText}
              onChange={e => {
                setFilterText(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => {
                if (!isOpen) setIsOpen(true);
              }}
              sx={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                width: '200px',
              }}
              aria-label="Search examples"
            />
          </Box>
          {isLoading && (
            <Box ml={2}>
              <Spinner size="small" />
            </Box>
          )}
        </Box>
        <Text as="span" fontSize={0} color="fg.muted">
          {selectedExample.path}
        </Text>
      </Box>
      {error && (
        <Flash variant="danger" sx={{ mt: 2 }}>
          {error}
        </Flash>
      )}
    </Box>
  );
};

/**
 * Main ExampleSelector component.
 * Renders the header and loads the selected example dynamically.
 */
const ExampleSelector = () => {
  const [selectedPath, _setSelectedPath] = useState<string>(getSelectedExample);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exampleContainerRef = useRef<HTMLDivElement>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load once on mount - examples render themselves to DOM
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;

    setIsLoading(true);
    setError(null);

    importExample(selectedPath)
      .then(() => {
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load example:', err);
        setError(`Failed to load example "${selectedPath}": ${err.message}`);
        setIsLoading(false);
      });
  }, []); // Empty deps - only run once on mount

  const handleSelect = (path: string) => {
    if (path === selectedPath) return;

    // Save selection and reload page with new example
    saveExample(path);

    // Update URL and reload
    const url = new URL(window.location.href);
    url.searchParams.set('example', path);
    window.location.href = url.toString();
  };

  return (
    <ThemeProvider colorMode="auto">
      <BaseStyles>
        <ExampleSelectorHeader
          selectedPath={selectedPath}
          onSelect={handleSelect}
          isLoading={isLoading}
          error={error}
        />
        {/* Examples render themselves to document.body, this is just a placeholder */}
        <div ref={exampleContainerRef} />
      </BaseStyles>
    </ThemeProvider>
  );
};

// Create and mount the selector
const selectorDiv = document.createElement('div');
selectorDiv.id = 'example-selector-root';
// Insert at the beginning of body so the header appears on top
document.body.insertBefore(selectorDiv, document.body.firstChild);

const root = createRoot(selectorDiv);
root.render(<ExampleSelector />);

export { EXAMPLES, getSelectedExample, saveExample };
export default ExampleSelector;
