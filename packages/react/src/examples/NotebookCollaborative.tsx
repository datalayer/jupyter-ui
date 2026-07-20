/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Checkbox, FormControl, Heading } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServerConnection } from '@jupyterlab/services';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { useJupyter, JupyterCollaborationProvider } from '../jupyter';
import { Notebook } from '../components';
import nbformatExample from './notebooks/NotebookExample1.ipynb.json';

const ROOM_PATH = 'notebook-collaboration-example.ipynb';
const NOTEBOOK_ID = 'notebook-collaboration-example';
const NOTEBOOK_ID_COLLABORATOR_1 = 'notebook-collaboration-example-1';
const NOTEBOOK_ID_COLLABORATOR_2 = 'notebook-collaboration-example-2';

const NotebookCollaborativeExample = () => {
  const { serviceManager } = useJupyter();
  const [nbformat] = useState(nbformatExample as INotebookContent);
  const [enableCollaboration, setEnableCollaboration] = useState(false);
  const [readonly] = useState(false);
  const [isCollaborationReady, setIsCollaborationReady] = useState(false);
  const [collaborationError, setCollaborationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    const ensureRoomNotebook = async () => {
      if (!enableCollaboration || !serviceManager) {
        setIsCollaborationReady(false);
        setCollaborationError(null);
        return;
      }

      setIsCollaborationReady(false);
      setCollaborationError(null);

      try {
        await serviceManager.ready;
        await serviceManager.contents.get(ROOM_PATH, { content: false });
      } catch (error) {
        const responseError = error as ServerConnection.ResponseError;
        if (responseError?.response?.status !== 404) {
          if (!cancelled) {
            setCollaborationError(String(error));
          }
          return;
        }

        try {
          await serviceManager.contents.save(ROOM_PATH, {
            type: 'notebook',
            format: 'json',
            content: nbformat,
          });
        } catch (saveError) {
          // Some backends respond with a non-JSON error payload even when the
          // create operation succeeded. Recheck existence before failing.
          try {
            await serviceManager.contents.get(ROOM_PATH, { content: false });
          } catch {
            if (!cancelled) {
              setCollaborationError(String(saveError));
            }
            return;
          }
        }
      }

      if (!cancelled) {
        setIsCollaborationReady(true);
      }
    };

    ensureRoomNotebook();

    return () => {
      cancelled = true;
    };
  }, [enableCollaboration, nbformat, serviceManager]);

  const collaborationProvider1 = useMemo(() => {
    if (!enableCollaboration || !isCollaborationReady) {
      return undefined;
    }
    return new JupyterCollaborationProvider({ path: ROOM_PATH });
  }, [enableCollaboration, isCollaborationReady]);

  const collaborationProvider2 = useMemo(() => {
    if (!enableCollaboration || !isCollaborationReady) {
      return undefined;
    }
    return new JupyterCollaborationProvider({ path: ROOM_PATH });
  }, [enableCollaboration, isCollaborationReady]);

  return (
    <ExampleJupyterReactTheme>
      <Box p={3}>
        <Heading as="h2" sx={{ mb: 3 }}>
          Notebook Collaboration Example
        </Heading>

        <Box sx={{ mb: 3 }}>
          <FormControl>
            <Checkbox
              checked={enableCollaboration}
              onChange={e => setEnableCollaboration(e.target.checked)}
            />
            <FormControl.Label>Enable collaboration mode</FormControl.Label>
          </FormControl>
        </Box>

        {enableCollaboration &&
          !isCollaborationReady &&
          !collaborationError && (
            <Box sx={{ mb: 3, p: 2, bg: 'attention.subtle' }}>
              Preparing collaboration room notebook...
            </Box>
          )}

        {collaborationError && (
          <Box sx={{ mb: 3, p: 2, bg: 'danger.subtle' }}>
            Collaboration setup failed: {collaborationError}
          </Box>
        )}

        {enableCollaboration && isCollaborationReady ? (
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: 'row',
            }}
          >
            <Box
              sx={{
                flex: 1,
                border: '1px solid',
                borderColor: 'border.default',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bg: 'canvas.subtle',
                  borderBottom: '1px solid',
                  borderColor: 'border.default',
                  fontWeight: 'bold',
                }}
              >
                Collaborator 1
              </Box>
              {serviceManager ? (
                <Notebook
                  id={NOTEBOOK_ID_COLLABORATOR_1}
                  height="calc(100vh - 280px)"
                  nbformat={nbformat}
                  readonly={readonly}
                  serviceManager={serviceManager}
                  startDefaultKernel={true}
                  collaborationProvider={collaborationProvider1}
                />
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  Loading ServiceManager...
                </Box>
              )}
            </Box>
            <Box
              sx={{
                flex: 1,
                border: '1px solid',
                borderColor: 'border.default',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bg: 'canvas.subtle',
                  borderBottom: '1px solid',
                  borderColor: 'border.default',
                  fontWeight: 'bold',
                }}
              >
                Collaborator 2
              </Box>
              {serviceManager ? (
                <Notebook
                  id={NOTEBOOK_ID_COLLABORATOR_2}
                  height="calc(100vh - 280px)"
                  nbformat={nbformat}
                  readonly={readonly}
                  serviceManager={serviceManager}
                  startDefaultKernel={false}
                  collaborationProvider={collaborationProvider2}
                />
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  Loading ServiceManager...
                </Box>
              )}
            </Box>
          </Box>
        ) : !enableCollaboration ? (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'border.default',
              borderRadius: 2,
            }}
          >
            {serviceManager ? (
              <Notebook
                id={NOTEBOOK_ID}
                height="calc(100vh - 200px)"
                nbformat={nbformat}
                readonly={readonly}
                serviceManager={serviceManager}
                startDefaultKernel={true}
                collaborationProvider={undefined}
              />
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                Loading ServiceManager...
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            Preparing collaboration room...
          </Box>
        )}
      </Box>
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookCollaborativeExample />);
