/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { useSystemColorMode } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import { jupyterLabTheme, JupyterReactTheme } from '../theme';
import { Text, ToggleSwitch, theme as primerTheme } from '@primer/react';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { NotebookToolbar } from './../components/notebook/toolbar/NotebookToolbar';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookThemeExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const [theme, setTheme] = useState<any>(jupyterLabTheme);
  const [isOn, setIsOn] = useState(false);
  const systemMode = useSystemColorMode();
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  const onClick = useCallback(() => {
    setIsOn(!isOn);
  }, [isOn]);
  useEffect(() => {
    if (isOn) {
      setTheme(primerTheme);
    } else {
      setTheme(jupyterLabTheme);
    }
  }, [isOn]);
  const handleSwitchChange = useCallback((on: boolean) => {
    setIsOn(on);
  }, []);
  return (
    <>
      <JupyterReactTheme
        theme={theme}
        colormode={systemMode}
        backgroundColor="var(--bgColor-default)"
      >
        <Text
          fontSize={2}
          fontWeight="bold"
          id="switch-label"
          display="block"
          mb={1}
        >
          Primer Theme
        </Text>
        <ToggleSwitch
          size="small"
          onClick={onClick}
          onChange={handleSwitchChange}
          checked={isOn}
          statusLabelPosition="end"
          aria-labelledby="switch-label"
        />
        {serviceManager && defaultKernel && (
          <Notebook
            id="notebook-theme-id"
            kernel={defaultKernel}
            serviceManager={serviceManager}
            nbformat={NBFORMAT as INotebookContent}
            height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
            extensions={extensions}
            Toolbar={NotebookToolbar}
            startDefaultKernel
          />
        )}
      </JupyterReactTheme>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookThemeExample />);
