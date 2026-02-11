/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { Box } from '@primer/react';
import { ServerConnection } from '@jupyterlab/services';
import { ITerminal } from '@jupyterlab/terminal';
import TerminalAdapter from './TerminalAdapter';
import { useJupyter } from './../../jupyter/JupyterUse';
import LuminoBox from '../lumino/LuminoBox';
import useTerminalStore from './TerminalState';

export const Terminal = ({
  height = '100%',
  colormode = 'dark',
  serverSettings: serverSettingsProp,
  ...rest
}: Terminal.ITerminalOptions) => {
  const terminalStore = useTerminalStore();
  const { serverSettings: serverSettingsFromStore } = useJupyter({
    terminals: true,
  });
  const serverSettings = serverSettingsProp ?? serverSettingsFromStore;
  const [adapter, setAdapter] = useState<TerminalAdapter>();
  useEffect(() => {
    if (serverSettings) {
      const adapter = new TerminalAdapter({
        serverSettings,
        height,
        colormode,
        ...rest,
      });
      terminalStore.setAdapter(adapter);
      setAdapter(adapter);
    }
  }, [serverSettings]);
  return adapter ? (
    <Box
      sx={{
        '& .lm-BoxPanel': {
          height: `${height} !important`,
        },
      }}
    >
      <LuminoBox>{adapter.panel}</LuminoBox>
    </Box>
  ) : (
    <></>
  );
};

export namespace Terminal {
  export interface ITerminalOptions {
    height?: string;
    colormode?: ITerminal.Theme;
    /**
     * Server connection settings to use for the terminal.
     * When provided, the terminal connects to this specific server
     * instead of using the global Jupyter store settings.
     */
    serverSettings?: ServerConnection.ISettings;
    /**
     * Code to be executed at terminal startup
     */
    initCode?: string;
  }
}

export default Terminal;
