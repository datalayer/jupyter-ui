/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Flash, Heading, Link, Text } from '@primer/react';
import { useCoreStore } from '@datalayer/core';
import { useIAMStore } from '@datalayer/core/lib/state/substates';
import { searchWorkspace } from '@datalayer/core/lib/api/spacer/spaces';
import { LexicalPrimerThemeProvider } from '..';
import { useExampleThemeStore } from './themeStore';

type CollaboratorIdentity = {
  name: string;
  color: string;
  clientID: number;
};

const DEFAULT_ROOM_ID = 'jupyter-lexical-collab-room-1';

/**
 * Where the two panes meet by default: the Loro server `make start` brings up
 * beside Vite (`scripts/loroServer.mjs`, the `lexical-loro` Python package).
 *
 * Not the Datalayer spacer. A spacer room is a *document* — the product's own
 * editor passes the uid of a document the person may open — so an invented
 * room name is refused however good the token is, and the client retries in a
 * loop with nothing on screen to say why. The banner below offers a document
 * of the reader's own instead, once there is one to offer.
 */
const DEFAULT_WEBSOCKET_URL = 'ws://localhost:3002';

const getWebsocketUrlFromUrl = () =>
  new URLSearchParams(window.location.search).get('collabWs') ??
  DEFAULT_WEBSOCKET_URL;

const buildPaneUrl = (
  pane: '1' | '2',
  roomId: string,
  websocketUrl: string,
) => {
  const url = new URL(window.location.href);
  url.searchParams.set('collabWs', websocketUrl);
  url.searchParams.set('standalone', 'true');
  url.searchParams.set('example', 'LexicalSimple');
  url.searchParams.set('collab', 'true');
  url.searchParams.set('collabRoom', roomId);
  url.searchParams.set('collabPane', pane);
  // Enable the Jupyter plugin with runtime assignment in each collaborative
  // pane, exactly as the standalone Lexical Simple example does. LexicalSimple
  // reads this `runtime` param and passes it to `Editor` via `runtimeEnabled`.
  url.searchParams.set('runtime', 'true');
  return url.toString();
};

const buildRoomUrl = (roomId: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set('example', 'LexicalCollaborative');
  url.searchParams.set('collabRoom', roomId);
  return url.toString();
};

const getRoomIdFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('collabRoom') || DEFAULT_ROOM_ID;
};

const generateRoomId = () =>
  `jupyter-lexical-collab-room-${Math.random().toString(36).slice(2, 10)}`;

const LexicalCollaborative = () => {
  const [roomId, setRoomId] = useState<string>(() => getRoomIdFromUrl());
  const websocketUrl = getWebsocketUrlFromUrl();
  const isDatalayerRoom = /spacer/.test(websocketUrl);

  /*
    A document of the reader's own, to offer as the alternative to the local
    room: its uid is the room, which is what the product's own editor passes
    and what the spacer accepts. Asked for only while on the local server and
    only while signed in — there is nothing to list otherwise.
  */
  const { configuration } = useCoreStore();
  const { token: iamToken } = useIAMStore();
  const spacerUrl = configuration?.spacerUrl;
  const [ownDocument, setOwnDocument] = useState<{
    uid: string;
    name: string;
  } | null>(null);
  useEffect(() => {
    if (isDatalayerRoom || !spacerUrl || !iamToken) {
      return;
    }
    let current = true;
    searchWorkspace(
      { baseUrl: spacerUrl, token: iamToken },
      { types: 'document', max: 1 },
    )
      .then(answer => {
        const item = answer.items?.[0];
        if (current && item?.uid) {
          setOwnDocument({
            uid: item.uid,
            name:
              (item.document_name_s as string) ||
              (item.name_t as string) ||
              item.uid,
          });
        }
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [iamToken, isDatalayerRoom, spacerUrl]);

  /** The address that opens this same example on that document's room. */
  const datalayerRoomUrl = useMemo(() => {
    if (!ownDocument || !spacerUrl) {
      return null;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('example', 'LexicalCollaborative');
    url.searchParams.set('collabRoom', ownDocument.uid);
    url.searchParams.set(
      'collabWs',
      `${spacerUrl.replace(/\/$/, '').replace(/^http/, 'ws')}/api/spacer/v1/lexical/ws`,
    );
    return url.toString();
  }, [ownDocument, spacerUrl]);
  const [identities, setIdentities] = useState<{
    '1'?: CollaboratorIdentity;
    '2'?: CollaboratorIdentity;
  }>({});

  const roomUrl = useMemo(() => buildRoomUrl(roomId), [roomId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only trust messages from the same origin (the panes are iframes of
      // this same app).
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = event.data;
      if (
        !data ||
        data.type !== 'lexical-collaborator-identity' ||
        (data.pane !== '1' && data.pane !== '2')
      ) {
        return;
      }
      setIdentities(prev => ({
        ...prev,
        [data.pane]: {
          name: data.name,
          color: data.color,
          clientID: data.clientID,
        },
      }));
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleNewRoom = () => {
    const nextRoomId = generateRoomId();
    setRoomId(nextRoomId);
    setIdentities({});
    const url = new URL(window.location.href);
    url.searchParams.set('example', 'LexicalCollaborative');
    url.searchParams.set('collabRoom', nextRoomId);
    window.history.replaceState({}, '', url.toString());
  };

  const renderPaneTitle = (pane: '1' | '2') => {
    const identity = identities[pane];
    const fallback = `Collaborator ${pane}`;
    if (!identity) {
      return fallback;
    }
    const shortClientId = String(identity.clientID).slice(0, 4);
    return (
      <Text as="span" sx={{ color: identity.color, fontWeight: 'bold' }}>
        {`${identity.name} ${shortClientId}`}
      </Text>
    );
  };

  return (
    <LexicalPrimerThemeProvider useStore={useExampleThemeStore}>
      <Box sx={{ p: 3 }}>
        <Heading as="h2" sx={{ mb: 2 }}>
          Lexical Collaborative
        </Heading>
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 3,
            flexWrap: 'wrap',
          }}
        >
          <Text
            as="p"
            sx={{ m: 0, color: 'var(--fgColor-muted)', flex: 1, minWidth: 280 }}
          >
            Two standalone lexical examples side by side in the same room.
          </Text>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 2,
              minWidth: 320,
            }}
          >
            <Text
              as="span"
              title={roomUrl}
              sx={{
                fontSize: 0,
                color: 'var(--fgColor-muted)',
                fontFamily: 'monospace',
                maxWidth: 260,
                wordBreak: 'break-all',
                textAlign: 'right',
              }}
            >
              {roomId}
            </Text>
            <Button size="small" onClick={handleNewRoom}>
              New room
            </Button>
          </Box>
        </Box>

        {/* Which server the panes meet on, and what it asks of them. */}
        <Flash variant={isDatalayerRoom ? 'warning' : 'default'} sx={{ mb: 3 }}>
          {isDatalayerRoom ? (
            <>
              Meeting on the Datalayer spacer at <code>{websocketUrl}</code>. A
              room there is a document: <code>{roomId}</code> has to be the uid
              of one you may open, and you have to be signed in, or the panes
              will be refused and keep retrying.
            </>
          ) : (
            <>
              Meeting on <code>{websocketUrl}</code>, the room{' '}
              <code>make start</code> brings up beside the examples.
              {datalayerRoomUrl && ownDocument ? (
                <>
                  {' '}
                  To use a Datalayer document instead, open{' '}
                  <Link href={datalayerRoomUrl}>{ownDocument.name}</Link>.
                </>
              ) : (
                <>
                  {' '}
                  A Datalayer document can host the room too: sign in, and the
                  first of your documents is offered here.
                </>
              )}
            </>
          )}
        </Flash>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: ['1fr', '1fr 1fr'],
            gap: 3,
          }}
        >
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'var(--borderColor-default)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'var(--borderColor-default)',
                bg: 'var(--bgColor-muted)',
              }}
            >
              {renderPaneTitle('1')}
            </Box>
            <iframe
              src={buildPaneUrl('1', roomId, websocketUrl)}
              title="Lexical Collaborator 1"
              style={{
                width: '100%',
                height: 'calc(100vh - 220px)',
                border: 'none',
              }}
            />
          </Box>

          <Box
            sx={{
              border: '1px solid',
              borderColor: 'var(--borderColor-default)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'var(--borderColor-default)',
                bg: 'var(--bgColor-muted)',
              }}
            >
              {renderPaneTitle('2')}
            </Box>
            <iframe
              src={buildPaneUrl('2', roomId, websocketUrl)}
              title="Lexical Collaborator 2"
              style={{
                width: '100%',
                height: 'calc(100vh - 220px)',
                border: 'none',
              }}
            />
          </Box>
        </Box>
      </Box>
    </LexicalPrimerThemeProvider>
  );
};

export default LexicalCollaborative;
