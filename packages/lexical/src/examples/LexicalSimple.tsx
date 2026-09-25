/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useMemo, useCallback } from 'react';
import { Button, Flash, Heading, Text, ToggleSwitch } from '@primer/react';
import { Box, collaboratorColor } from '@datalayer/primer-addons';
import { useCoreStore } from '@datalayer/core';
import { useSimpleAuthStore } from '@datalayer/core/lib/views/otel';
import { useIAMStore } from '@datalayer/core/lib/state/substates';
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
  // Which palette a collaborator's colour comes out of.
  const { theme: themeVariant, colorMode } = useExampleThemeStore();
  const configuration = useCoreStore(state => state.configuration);
  /*
    A Datalayer document room is not open to anyone: the spacer checks an IAM
    token on the websocket. This reads the same store the product's own
    document editor reads (`useIAMStore`, see `LiterateEditor` in the
    landings app), so signing in here is what signing in there is. The older
    `useSimpleAuthStore` is kept as a fallback for a page that only did the
    simple sign-in, and `?collabToken=` still overrides both for a quick
    test against another deployment.
  */
  const { token: iamToken } = useIAMStore();
  const authToken = useSimpleAuthStore(state => state.token);
  const urlParams = new URLSearchParams(window.location.search);
  const isCollaborative =
    urlParams.get('collab') === 'true' || urlParams.get('collabRoom') !== null;
  const collabRoom =
    urlParams.get('collabRoom') || 'jupyter-lexical-collaboration-room';
  const collabPane = urlParams.get('collabPane') || '1';
  const spacerBaseUrl =
    configuration?.spacerUrl || 'https://prod1.datalayer.run';
  const collabWsBase =
    urlParams.get('collabWs') ||
    `${spacerBaseUrl.replace(/\/$/, '').replace(/^http/, 'ws')}/api/spacer/v1/lexical/ws`;
  const collabToken =
    urlParams.get('collabToken') ||
    iamToken ||
    authToken ||
    configuration?.token ||
    '';
  /*
    A local server (`?collabWs=ws://localhost:1235`) asks for nothing; the
    Datalayer spacer does. Saying so beats a websocket that opens and closes
    with nothing on screen to explain it.
  */
  const roomNeedsToken = !urlParams.get('collabWs');
  const missingToken = isCollaborative && roomNeedsToken && !collabToken;
  const collabWs = collabToken
    ? `${collabWsBase}${collabWsBase.includes('?') ? '&' : '?'}token=${encodeURIComponent(collabToken)}`
    : collabWsBase;

  const collaboration = useMemo(() => {
    if (!isCollaborative) {
      return undefined;
    }

    const username = collabPane === '2' ? 'Collaborator 2' : 'Collaborator 1';
    // Their colour is the theme's, picked by who they are, so both panes
    // agree without either being told (see `CollaboratorPalette`).
    const color = collaboratorColor(username, themeVariant, colorMode);

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
  }, [
    collabPane,
    collabRoom,
    collabWs,
    isCollaborative,
    themeVariant,
    colorMode,
  ]);

  const handleSessionConnection = useCallback(() => {
    // Intentionally no-op: avoid noisy session logs on reconnection/state updates.
  }, []);

  return (
    <Box sx={{ mx: 'auto', maxWidth: 1100, px: 3 }}>
      {missingToken ? (
        <Flash variant="warning" sx={{ mb: 3 }}>
          Not signed in. A Datalayer document room checks an IAM token on the
          websocket, so this pane will not join one. Sign in, or point the pane
          at a server that asks for nothing with{' '}
          <code>?collabWs=ws://localhost:1235</code>.
        </Flash>
      ) : null}
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
        <Text as="p" sx={{ m: 0, color: 'var(--fgColor-muted)' }}>
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
            sx={{ fontSize: 0, color: 'var(--fgColor-muted)' }}
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
