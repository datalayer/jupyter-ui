/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {useEffect, useMemo} from 'react';
import {render} from 'react-dom';
import {
  Jupyter,
  useJupyter,
  Kernel,
  Cell,
  FileBrowser,
  FileManagerJupyterLab,
  Commands,
  Console,
  Notebook,
  Settings,
  Terminal,
} from '@datalayer/jupyter-react';
import { Output } from '@datalayer/jupyter-react/lib/components/output/Output';
// import Dialog from './../components//dialog/Dialog';
import DialogToolbar from './dialog/DialogToolbar';
import CellToolbar from './cell/CellToolbar';
import ConsoleToolbar from './console/ConsoleToolbar';
import FileBrowserToolbar from './filebrowser/FileBrowserToolbar';
import NotebookToolbar from './notebook/NotebookToolbarSimple';
import OutputToolbar from './outputs/OutputsToolbar';
import SettingsToolbar from './settings/SettingsToolbar';
import LuminoComponent from './lumino/LuminoComponent';
import TerminalToolbar from './terminal/TerminalToolbar';
import CommandsToolbar from './commands/CommandsToolbar';

import './../App.css';

/**
 * The source to be shown in the examples.
 */
const source = `from IPython.display import display
for i in range(3):
    display('😃 String {} added to the DOM in separated DIV.'.format(i))

import numpy as np
import matplotlib.pyplot as plt
x1 = np.linspace(0.0, 5.0)
x2 = np.linspace(0.0, 2.0)
y1 = np.cos(2 * np.pi * x1) * np.exp(-x1)
y2 = np.cos(2 * np.pi * x2)
fig, (ax1, ax2) = plt.subplots(2, 1)
fig.suptitle('A tale of 2 subplots')
ax1.plot(x1, y1, 'o-')
ax1.set_ylabel('Damped oscillation')
ax2.plot(x2, y2, '.-')
ax2.set_xlabel('time (s)')
ax2.set_ylabel('Undamped')
plt.show()`;

const CELL_ID = 'cell-id-1';

const NOTEBOOK_ID = 'notebook-id-1';

/**
 * A simple example for the Jupyter UI.
 */
const AllExample = () => {
  const { kernelManager, serviceManager } = useJupyter();
  const kernel = useMemo(() => {
    if (serviceManager && kernelManager)
      return new Kernel({
        kernelManager,
        kernelName: 'python',
        kernelSpecName: 'python',
        kernelType: 'notebook',
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
  }, [kernelManager, serviceManager]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <OutputToolbar />
      <Output
        showEditor
        autoRun={false}
        kernel={kernel}
        code={"print('Hello Datalayer 👍')"}
      />
      <Output
        autoRun={false}
        kernel={kernel}
        code={"print('Hello Datalayer 👍')"}
      />
      <Output autoRun kernel={kernel} code={source} />
      <Output
        autoRun
        kernel={kernel}
        code={
          "print('=> Hello Datalayer again... I am the output of an non-shown editor 👍 <=')"
        }
      />
      <CellToolbar cellId={CELL_ID} />
      <Cell
        id={CELL_ID}
        kernel={kernel}
        source={source}
      />
      <CommandsToolbar />
      <Commands />
      <ConsoleToolbar />
      <Console />
      <DialogToolbar />
      {/*
      <Dialog />
      */}
      <FileBrowserToolbar />
      {serviceManager && <FileBrowser serviceManager={serviceManager}/> }
      <FileManagerJupyterLab />
      <NotebookToolbar notebookId={NOTEBOOK_ID} />
      <Notebook id={NOTEBOOK_ID} path=".datalayer/ping.ipynb"/>
      <SettingsToolbar />
      <Settings />
      <LuminoComponent />
      <TerminalToolbar />
      <Terminal />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter startDefaultKernel collaborative terminals>
    <AllExample />
  </Jupyter>,
  div
);
