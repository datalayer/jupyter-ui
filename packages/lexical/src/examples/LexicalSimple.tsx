/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useMemo, useCallback } from 'react';
import { Button, ToggleSwitch, Text, Heading } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { useCoreStore } from '@datalayer/core';
import { useSimpleAuthStore } from '@datalayer/core/lib/views/otel';
import {
  useLexical,
  Editor,
  LexicalProvider,
  LexicalPrimerThemeProvider,
  nbformatToLexical,
} from '..';
import { useExampleThemeStore } from './themeStore';

import LEXICAL_MODEL from './content/Example.lexical.json';
import NBFORMAT_MODEL from './content/Example.ipynb.json';

const INITIAL_LEXICAL_STATE = JSON.stringify(LEXICAL_MODEL);

const LexicalEditor = ({ hasRuntime }: { hasRuntime: boolean }) => {
  const { editor } = useLexical();
  const configuration = useCoreStore(state => state.configuration);
  const authToken = useSimpleAuthStore(state => state.token);
  const urlParams = new URLSearchParams(window.location.search);
  const isCollaborative =
    urlParams.get('collab') === 'true' || urlParams.get('collabRoom') !== null;
  const collabRoom =
    urlParams.get('collabRoom') || 'jupyter-lexical-collaboration-room';
  const collabPane = urlParams.get('collabPane') || '1';
  const spacerBaseUrl =
    configuration?.spacerUrl ||
    configuration?.datalayerUrl ||
    'https://prod1.datalayer.run';
  const collabWsBase =
    urlParams.get('collabWs') ||
    `${spacerBaseUrl.replace(/\/$/, '').replace(/^http/, 'ws')}/api/spacer/v1/lexical/ws`;
  const collabToken =
    urlParams.get('collabToken') || authToken || configuration?.token || '';
  const collabWs = collabToken
    ? `${collabWsBase}${collabWsBase.includes('?') ? '&' : '?'}token=${encodeURIComponent(collabToken)}`
    : collabWsBase;

  const collaboration = useMemo(() => {
    if (!isCollaborative) {
      return undefined;
    }

    const color = collabPane === '2' ? '#db61a2' : '#1570ef';
    const username = collabPane === '2' ? 'Collaborator 2' : 'Collaborator 1';

    return {
      id: collabRoom,
      websocketUrl: collabWs,
      username,
      cursorColor: color,
      // Only the first pane seeds the initial rich document. The second pane
      // starts empty and receives the content through Loro synchronization,
      // which avoids duplicating the seed into the shared CRDT.
      initialEditorState:
        collabPane === '2' ? undefined : INITIAL_LEXICAL_STATE,
      onIdentityResolved: (identity: {
        name: string;
        color: string;
        clientID: number;
      }) => {
        // Report the resolved collaborator identity to the parent window
        // (the LexicalCollaborative example renders the pane titles).
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: 'lexical-collaborator-identity',
              pane: collabPane,
              name: identity.name,
              color: identity.color,
              clientID: identity.clientID,
            },
            '*',
          );
        }
      },
      awarenessData: {
        user: {
          id: `pane-${collabPane}`,
          username,
          name: username,
          color,
        },
      },
    };
  }, [collabPane, collabRoom, collabWs, isCollaborative]);

  const handleSessionConnection = useCallback(() => {
    // Intentionally no-op: avoid noisy session logs on reconnection/state updates.
  }, []);

  return (
    <Box className="center">
      <Box>
        <Editor
          id={collaboration?.id}
          collaboration={collaboration}
          initialEditorState={INITIAL_LEXICAL_STATE}
          runtimeEnabled={hasRuntime}
          onSessionConnection={handleSessionConnection}
        />
        <Button
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            if (editor) {
              nbformatToLexical(NBFORMAT_MODEL as any, editor);
            }
          }}
        >
          Insert Notebook Model
        </Button>
      </Box>
    </Box>
  );
};

const AppToolbar = (props: {
  hasRuntime: boolean;
  toggleRuntime: (v: boolean) => void;
}) => {
  const { hasRuntime, toggleRuntime } = props;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      <Box sx={{ flex: 1, textAlign: 'left' }}>
        <Heading as="h2" sx={{ mb: 1 }}>
          Lexical Simple
        </Heading>
        <Text as="p" sx={{ m: 0, color: 'fg.muted' }}>
          Current lexical example.
        </Text>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          marginLeft: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Text
            id="runtime-toggle-label"
            sx={{ fontSize: 0, color: 'fg.muted' }}
          >
            Runtime
          </Text>
          <ToggleSwitch
            size="small"
            defaultChecked={hasRuntime}
            onChange={(on: boolean) => toggleRuntime(on)}
            statusLabelPosition="end"
            aria-labelledby="runtime-toggle-label"
          />
        </Box>
      </Box>
    </Box>
  );
};

export const LexicalSimple = () => {
  const getInitialRuntimeState = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCollabMode =
      urlParams.get('collab') === 'true' ||
      urlParams.get('collabRoom') !== null;
    const runtimeParam = urlParams.get('runtime');
    if (runtimeParam !== null) {
      return runtimeParam === 'true';
    }
    if (isCollabMode) {
      return false;
    }
    const stored = localStorage.getItem('hasRuntime');
    return stored !== 'false';
  };

  const [hasRuntime] = useState(getInitialRuntimeState);
  // Shared, persisted examples theme store (same pattern as jupyter-react
  // examples): the selector updates the store, and the provider below passes
  // the selected theme + colormode down so the example updates accordingly.
  const themeStore = useExampleThemeStore;

  const toggleRuntime = (newValue: boolean) => {
    localStorage.setItem('hasRuntime', String(newValue));
    const url = new URL(window.location.href);
    url.searchParams.set('runtime', String(newValue));
    window.location.href = url.toString();
  };

  return (
    <LexicalPrimerThemeProvider useStore={themeStore}>
      <AppToolbar hasRuntime={hasRuntime} toggleRuntime={toggleRuntime} />
      <LexicalProvider>
        <LexicalEditor hasRuntime={hasRuntime} />
      </LexicalProvider>
    </LexicalPrimerThemeProvider>
  );
};

export default LexicalSimple;
