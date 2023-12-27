/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Text, ToggleSwitch } from '@primer/react';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import { JupyterLabTheme } from '../jupyter/lab/JupyterLabTheme';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookThemed = () => {
  const [theme, setTheme] = useState<JupyterLabTheme>('light');
  const [isOn, setIsOn] = useState(false);
  //  const { setColorMode } = useTheme();
  const onClick = () => {
    if (isOn) {
      setTheme('light');
      //      setColorMode('day');
    } else {
      setTheme('dark');
      //      setColorMode('night');
    }
    setIsOn(!isOn);
  };
  const handleSwitchChange = (on: boolean) => {
    setIsOn(on);
  };
  return (
    <>
      <Jupyter
        //        jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
        //        jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
        //        jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
        theme={theme}
      >
        <Text
          fontSize={2}
          fontWeight="bold"
          id="switch-label"
          display="block"
          mb={1}
        >
          Dark Theme
        </Text>
        <ToggleSwitch
          size="small"
          onClick={onClick}
          onChange={handleSwitchChange}
          checked={isOn}
          statusLabelPosition="end"
          aria-labelledby="switch-label"
        />
        <Notebook
          nbformat={nbformat as INotebookContent}
          uid="notebook-model-uid"
          externalIPyWidgets={[
            { name: '@widgetti/jupyter-react', version: '0.3.0' },
            { name: 'bqplot', version: '0.5.42' },
            { name: 'jupyter-matplotlib', version: '0.11.3' },
          ]}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          cellSidebarMargin={120}
          CellSidebar={CellSidebar}
          Toolbar={NotebookToolbar}
        />
      </Jupyter>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookThemed />);
