/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { Box, Button, Heading, Text } from '@primer/react';
import { LexicalPrimerThemeProvider } from '..';
import { useExampleThemeStore } from './themeStore';

const DEFAULT_ROOM_ID = 'jupyter-lexical-collab-room-1';

const buildPaneUrl = (pane: '1' | '2', roomId: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set('standalone', 'true');
  url.searchParams.set('example', 'LexicalSimple');
  url.searchParams.set('collab', 'true');
  url.searchParams.set('collabRoom', roomId);
  url.searchParams.set('collabPane', pane);
  url.searchParams.set('runtime', 'false');
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

  const roomUrl = useMemo(() => buildRoomUrl(roomId), [roomId]);

  const handleNewRoom = () => {
    const nextRoomId = generateRoomId();
    setRoomId(nextRoomId);
    const url = new URL(window.location.href);
    url.searchParams.set('example', 'LexicalCollaborative');
    url.searchParams.set('collabRoom', nextRoomId);
    window.history.replaceState({}, '', url.toString());
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
          <Text as="p" sx={{ m: 0, color: 'fg.muted', flex: 1, minWidth: 280 }}>
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
                color: 'fg.muted',
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
              borderColor: 'border.default',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'border.default',
                bg: 'canvas.subtle',
              }}
            >
              Collaborator 1
            </Box>
            <iframe
              src={buildPaneUrl('1', roomId)}
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
              borderColor: 'border.default',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'border.default',
                bg: 'canvas.subtle',
              }}
            >
              Collaborator 2
            </Box>
            <iframe
              src={buildPaneUrl('2', roomId)}
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
