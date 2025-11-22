/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import {
  ServerConnection,
  ServiceManager,
  Session,
  Kernel,
} from '@jupyterlab/services';
import { Box, Text, Label, Button } from '@primer/react';

export type IKernelDetectiveProps = {
  serviceManager?: ServiceManager.IManager;
};

export const KernelDetective = (props: IKernelDetectiveProps) => {
  const { serviceManager } = props;
  const [serverSettings, setServerSettings] =
    useState<ServerConnection.ISettings>();
  const [sessions, setSessions] = useState<Session.IModel[]>([]);
  const [kernels, setKernels] = useState<Kernel.IModel[]>([]);
  const refresh = () => {
    if (serviceManager) {
      setServerSettings(serviceManager.serverSettings);
      serviceManager.sessions.refreshRunning().then(() => {
        setSessions(Array.from(serviceManager.sessions.running()));
        serviceManager.sessions.runningChanged.connect(() => {
          //
        });
      });
      serviceManager.kernels.refreshRunning().then(() => {
        setKernels(Array.from(serviceManager.kernels.running()));
        serviceManager.kernels.runningChanged.connect(() => {
          //
        });
      });
    }
  };
  useEffect(() => {
    refresh();
  }, [serviceManager]);
  return (
    <>
      {serviceManager && (
        <>
          <Box mb={3}>
            <Button onClick={refresh}>Refresh</Button>
          </Box>
          <Box>
            <Text as="h3">Server Settings</Text>
            <Label>Base URL</Label>
            <Text> {serverSettings?.baseUrl}</Text>
          </Box>
          <Box>
            <Text as="h3">Kernels</Text>
            {kernels.map(kernel => {
              return (
                <Box key={kernel.id}>
                  <Label>Kernel</Label>
                  <Text>
                    {' '}
                    {kernel.name} - {kernel.id} - {kernel.connections}{' '}
                    connections
                  </Text>
                </Box>
              );
            })}
          </Box>
          <Box>
            <Text as="h3">Sessions</Text>
            {sessions.map(session => {
              return (
                <Box key={session.id}>
                  <Label>Kernel</Label>
                  <Text>
                    {' '}
                    {session.kernel?.name} - {session.kernel?.id}
                  </Text>
                  <Label style={{ marginLeft: 10 }}>Session</Label>
                  <Text>
                    {' '}
                    {session.name} - {session.path} - {session.type}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </>
      )}
    </>
  );
};

export default KernelDetective;
