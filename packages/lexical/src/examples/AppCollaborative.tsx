/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { Box, Heading, Text } from '@primer/react';
import { LexicalPrimerThemeProvider } from '..';
import { useExampleThemeStore } from './themeStore';

const buildPaneUrl = (pane: '1' | '2') => {
  const url = new URL(window.location.href);
  url.searchParams.set('standalone', 'true');
  url.searchParams.set('example', 'AppSimple');
  url.searchParams.set('collab', 'true');
  url.searchParams.set('collabRoom', 'jupyter-lexical-collab-room-1');
  url.searchParams.set('collabPane', pane);
  return url.toString();
};

const AppCollaborative = () => {
  return (
    <LexicalPrimerThemeProvider useStore={useExampleThemeStore}>
      <Box sx={{ p: 3 }}>
        <Heading as="h2" sx={{ mb: 2 }}>
          Lexical Collaborative
        </Heading>
        <Text as="p" sx={{ mb: 3, color: 'fg.muted' }}>
          Two standalone lexical examples side by side using
          LoroCollaborationPlugin in the same room.
        </Text>

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
              src={buildPaneUrl('1')}
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
              src={buildPaneUrl('2')}
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

export default AppCollaborative;
