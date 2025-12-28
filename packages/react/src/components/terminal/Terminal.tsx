/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { Box } from '@primer/react';
import { ITerminal } from '@jupyterlab/terminal';
import TerminalAdapter from './TerminalAdapter';
import { useJupyter } from './../../jupyter/JupyterContext';
import LuminoBox from '../lumino/LuminoBox';
import useTerminalStore from './TerminalState';

export const Terminal = ({
  height = '100%',
  colormode = 'dark',
  ...rest
}: Terminal.ITerminalOptions) => {
  const terminalStore = useTerminalStore();
  const { serverSettings } = useJupyter({ terminals: true });
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
     * Code to be executed at terminal startup
     */
    initCode?: string;
  }
}

export default Terminal;
