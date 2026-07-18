/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import { Text, Flash, ActionList, TextInput, Button } from '@primer/react';
import { SignOutIcon, PencilAiIcon } from '@primer/octicons-react';
import { SearchIcon, CheckIcon } from '@primer/octicons-react';
import {
  AppearanceControlsWithStore,
  Box,
  DatalayerThemeProvider,
} from '@datalayer/primer-addons';
import { useCoreStore, coreStore, iamStore } from '@datalayer/core';
import { SignInSimple } from '@datalayer/core/lib/views/iam';
import { UserBadge } from '@datalayer/core/lib/views/profile';
import { useSimpleAuthStore } from '@datalayer/core/lib/views/otel';
import { useExampleThemeSettings, useExampleThemeStore } from './themeStore';

const LOCAL_STORAGE_KEY = 'jupyter-lexical-selected-example';

const EXAMPLES: Array<{ name: string; path: string; description: string }> = [
  {
    name: 'Lexical Simple',
    path: 'LexicalSimple',
    description: 'Current lexical example.',
  },
  {
    name: 'Lexical Collaborative',
    path: 'LexicalCollaborative',
    description: 'Two side-by-side iframe collaborators.',
  },
  {
    name: 'Lexical Nbformat',
    path: 'LexicalNbformat',
    description: 'Notebook (nbformat) rendered in lexical.',
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

  return 'LexicalSimple';
};

const saveExample = (path: string): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, path);
  } catch {
    // localStorage unavailable
  }
};

const parseJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isExpiredJwt = (token: string): boolean => {
  const payload = parseJwtPayload(token);
  if (!payload) {
    // Non-JWT tokens (for example API keys) should not be treated as expired.
    return false;
  }
  const exp = payload.exp;
  if (typeof exp !== 'number') {
    return false;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return nowSeconds >= exp;
};

const syncTokenToIamStore = (token: string | undefined) => {
  iamStore.setState({ token });
};

const ExamplesSidebar = ({
  selectedPath,
  onSelect,
  isLoading,
  error,
  onSignOut,
}: {
  selectedPath: string;
  onSelect: (path: string) => void;
  isLoading: boolean;
  error: string | null;
  onSignOut: () => void;
}) => {
  const [filter, setFilter] = useState('');
  const token = useSimpleAuthStore(state => state.token);

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

        {token && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <UserBadge token={token} variant="small" />
            <Button
              size="small"
              variant="invisible"
              leadingVisual={SignOutIcon}
              onClick={onSignOut}
            >
              Sign out
            </Button>
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
  const { colorMode, themeConfig, backgroundColor } = useExampleThemeSettings();
  const frameBackgroundColor = backgroundColor ?? 'var(--bgColor-default)';

  const token = useSimpleAuthStore(state => state.token);
  const setAuth = useSimpleAuthStore(state => state.setAuth);
  const clearAuth = useSimpleAuthStore(state => state.clearAuth);
  const configuration = useCoreStore(state => state.configuration);

  const isAuthenticated = !!token && !isExpiredJwt(token);

  const loginUrl = useMemo(() => {
    const iamUrl = (
      configuration?.iamUrl ||
      configuration?.datalayerUrl ||
      'https://prod1.datalayer.run'
    ).replace(/\/$/, '');
    return `${iamUrl}/api/iam/v1/login`;
  }, [configuration?.iamUrl, configuration?.datalayerUrl]);

  // Keep iamStore aligned with persisted auth token on load/refresh.
  useEffect(() => {
    syncTokenToIamStore(token || undefined);
  }, [token]);

  // Auto-detect expired token and force re-authentication (agent-runtimes pattern).
  useEffect(() => {
    if (token && isExpiredJwt(token)) {
      clearAuth();
      syncTokenToIamStore(undefined);
    }
  }, [token, clearAuth]);

  const handleSignIn = (newToken: string, handle: string) => {
    setAuth(newToken, handle);
    syncTokenToIamStore(newToken);
    coreStore.getState().setConfiguration({ token: newToken });
  };

  const handleSignOut = () => {
    clearAuth();
    syncTokenToIamStore(undefined);
    iamStore.getState().logout();
  };

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
    <DatalayerThemeProvider
      colorMode={colorMode}
      theme={themeConfig.primerTheme}
      themeStyles={themeConfig.themeStyles}
    >
      {isAuthenticated ? (
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
      ) : (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 'calc(100vw - 320px)',
            height: '100vh',
            overflow: 'auto',
            bg: 'canvas.backdrop',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 640 }}>
            <SignInSimple
              onSignIn={handleSignIn}
              onApiKeySignIn={apiKey => handleSignIn(apiKey, 'api-key-user')}
              loginUrl={loginUrl}
              title="Jupyter Lexical Examples"
              description="Sign in to use the online Spacer collaboration service."
              leadingIcon={<PencilAiIcon size={24} />}
            />
          </Box>
        </Box>
      )}
      <ExamplesSidebar
        selectedPath={selectedPath}
        onSelect={handleSelect}
        isLoading={isLoading}
        error={error}
        onSignOut={handleSignOut}
      />
    </DatalayerThemeProvider>
  );
};

export default Examples;
export { EXAMPLES, getSelectedExample, saveExample };
