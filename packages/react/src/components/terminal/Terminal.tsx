/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box } from '@primer/react';
import { ITerminal } from '@jupyterlab/terminal';
import TerminalAdapter from './TerminalAdapter';
import { terminalActions, terminalReducer } from './TerminalRedux';
import { useJupyter } from './../../jupyter/JupyterContext';
import LuminoBox from '../../jupyter/lumino/LuminoBox';

export const Terminal = (props: Terminal.ITerminalOptions) => {
  const { height } = props;
  const { injectableStore, serverSettings } = useJupyter();
  const dispatch = useDispatch();
  const [adapter, setAdapter] = useState<TerminalAdapter>();
  useEffect(() => {
    injectableStore.inject('terminal', terminalReducer);
    const adapter = new TerminalAdapter({
      serverSettings,
      ...props,
    });
    dispatch(terminalActions.update({ adapter }));
    setAdapter(adapter);
  }, []);
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
    colorMode?: ITerminal.Theme;
  }
}

Terminal.defaultProps = {
  height: '100%',
  colorMode: 'dark',
} as Partial<Terminal.ITerminalOptions>;

export default Terminal;
