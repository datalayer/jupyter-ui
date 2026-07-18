/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useRef } from 'react';
import { Text, Spinner, Flash, ActionList, TextInput } from '@primer/react';
import { SearchIcon, CheckIcon } from '@primer/octicons-react';
import { AppearanceControlsWithStore, Box } from '@datalayer/primer-addons';
import { LexicalPrimerThemeProvider } from '..';
import { useExampleThemeSettings, useExampleThemeStore } from './themeStore';

const LOCAL_STORAGE_KEY = 'jupyter-lexical-selected-example';

const EXAMPLES: Array<{ name: string; path: string; description: string }> = [
  {
    name: 'Lexical Simple',
    path: 'AppSimple',
    description: 'Current lexical example.',
  },
  {
    name: 'Lexical Collaborative (Iframe)',
    path: 'AppCollaborative',
    description: 'Two side-by-side iframe collaborators.',
  },
];

const getSelectedExample = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const exampleFromUrl = urlParams.get('example');
  if (exampleFromUrl && EXAMPLES.some(e => e.path === exampleFromUrl)) {
    return exampleFromUrl;
  }

  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && EXAMPLES.some(e => e.path === saved)) {
      return saved;
    }
  } catch {
    // localStorage unavailable
  }

  return 'AppSimple';
};

const saveExample = (path: string): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, path);
  } catch {
    // localStorage unavailable
  }
};

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

  const filteredExamples = EXAMPLES.filter(
    example =>
      example.name.toLowerCase().includes(filter.toLowerCase()) ||
      example.path.toLowerCase().includes(filter.toLowerCase()),
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
          📓 ✍️ Jupyter Lexical Examples
        </Text>
        <Box mt={2}>
          <AppearanceControlsWithStore useStore={useExampleThemeStore} />
        </Box>
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
                    {example.description}
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

const Examples = () => {
  const [selectedPath, setSelectedPath] = useState<string>(getSelectedExample);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { backgroundColor } = useExampleThemeSettings();
  const frameBackgroundColor = backgroundColor ?? 'var(--bgColor-default)';

  const getExampleUrl = (path: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('example', path);
    url.searchParams.set('standalone', 'true');
    return url.toString();
  };

  const handleSelect = (path: string) => {
    if (path === selectedPath) {
      return;
    }
    saveExample(path);
    const url = new URL(window.location.href);
    url.searchParams.set('example', path);
    window.history.pushState({}, '', url.toString());
    setIsLoading(true);
    setError(null);
    setSelectedPath(path);
  };

  return (
    <LexicalPrimerThemeProvider useStore={useExampleThemeStore}>
      <iframe
        ref={iframeRef}
        src={getExampleUrl(selectedPath)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(`Failed to load example "${selectedPath}"`);
          setIsLoading(false);
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 'calc(100vw - 320px)',
          height: '100vh',
          border: 'none',
          background: frameBackgroundColor,
        }}
        title={`Lexical Example: ${selectedPath}`}
      />
      <ExamplesSidebar
        selectedPath={selectedPath}
        onSelect={handleSelect}
        isLoading={isLoading}
        error={error}
      />
    </LexicalPrimerThemeProvider>
  );
};

export default Examples;
export { EXAMPLES, getSelectedExample, saveExample };
