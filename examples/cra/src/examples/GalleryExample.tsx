/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { UnderlineNav } from '@primer/react';
import { Box } from '@primer/react';
import {
  useJupyter, Cell, Commands, Console, Dialog, FileBrowser, FileManagerJupyterLab,
  OutputIPyWidgets, Notebook, Kernel, Settings, Terminal,
} from '@datalayer/jupyter-react';
import { Output } from '@datalayer/jupyter-react/lib/components/output/Output';
import { IOutput } from '@jupyterlab/nbformat';
import { AppsIcon, CpuIcon } from '@primer/octicons-react';
import { state, view } from './ipywidgets/IPyWidgetsSimple';
import JupyterLabHeadlessAppExample from './labapp/JupyterLabHeadlessApp';
import LuminoToolbar from './lumino/LuminoToolbar';
import LuminoComponent from './lumino/LuminoComponent';
import IPyWidgetsToolbar from './ipywidgets/IPyWidgetsToolbar';
import CellToolbar from './cell/CellToolbar';
import CommandsToolbar from './commands/CommandsToolbar';
import NotebookToolbarSimple from './notebook/NotebookToolbarSimple';
import CellSidebar from './notebook/cell/CellSidebar';
import OutputToolbar from './outputs/OutputsToolbar';
import FileBrowserToolbar from './filebrowser/FileBrowserToolbar';
import ConsoleToolbar from './console/ConsoleToolbar';
import SettingsToolbar from './settings/SettingsToolbar';
import DialogToolbar from './dialog/DialogToolbar';
import TerminalToolbar from './terminal/TerminalToolbar';

/**
 * The source code to be shown in the examples.
 */
const SOURCE = `from IPython.display import display
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

const OUTPUTS: IOutput[] = [
  {
    data: {
      'application/json': {
        array: [1, 2, 3],
        bool: true,
        object: {
          foo: 'bar',
        },
        string: 'string',
      },
      'text/plain': ['<IPython.core.display.JSON object>'],
    },
    execution_count: 8,
    metadata: {
      'application/json': {
        expanded: false,
        root: 'root',
      },
    },
    output_type: 'execute_result',
  },
];

const CELL_ID = 'cell-id-gallery';

const NOTEBOOK_ID = 'notebook-id-gallery';

const GalleryExample = () => {
  const [tab, setTab] = useState('Notebook');
  const [kernel, setKernel] = useState<Kernel>();
  const { kernelManager, serviceManager } = useJupyter();
  useEffect(() => {
    if (serviceManager && kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: 'python',
        kernelSpecName: 'python',
        kernelType: 'notebook',
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
      setKernel(kernel);
    }
  }, [kernelManager, serviceManager]);
  return (
    <Box>
      <Box mb={3}>
        <UnderlineNav aria-label='gallery'>
          <UnderlineNav.Item
            icon={CpuIcon}
            aria-current={tab === 'Notebook' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Notebook');
            }}
          >
            Notebook
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={CpuIcon}
            aria-current={tab === 'Cell' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Cell');
            }}
          >
            Cell
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={CpuIcon}
            aria-current={tab === 'LabApp' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('LabApp');
            }}
          >
            Lab Application
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            aria-current={tab === 'Outputs' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Outputs');
            }}
          >
            Outputs
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={CpuIcon}
            aria-current={tab === 'IPyWidgets' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('IPyWidgets');
            }}
          >
            IPyWidgets
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            aria-current={tab === 'Terminal' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Terminal');
            }}
          >
            Terminal
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            aria-current={tab === 'Console' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Console');
            }}
          >
            Console
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            aria-current={tab === 'Commands' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Commands');
            }}
          >
            Commands
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            aria-current={tab === 'Dialog' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Dialog');
            }}
          >
            Dialog
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            aria-current={tab === 'File Browser' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('File Browser');
            }}
          >
            File Browser
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            aria-current={tab === 'Lumino' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Lumino');
            }}
          >
            Lumino
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            aria-current={tab === 'Settings' ? "page" : undefined}
            onSelect={e => {
              e.preventDefault();
              setTab('Settings');
            }}
          >
            Settings
          </UnderlineNav.Item>
        </UnderlineNav>
      </Box>
      { kernel && <>
        <Box>
          {tab === 'Notebook' && (
            <>
              <NotebookToolbarSimple notebookId={NOTEBOOK_ID} />
              <Notebook
                id={NOTEBOOK_ID}
                path=".datalayer/ping.ipynb"
                CellSidebar={CellSidebar}
              />
            </>
          )}
          {tab === 'Cell' && (
            <>
              <CellToolbar cellId={CELL_ID} />
              <Cell
                id={CELL_ID}
                kernel={kernel}
                source={SOURCE}
              />
            </>
          )}
          {tab === 'LabApp' && (
            <>
              <JupyterLabHeadlessAppExample />
            </>
          )}
          {tab === 'Outputs' && (
            <>
              <OutputToolbar />
              <Output
                autoRun={false}
                kernel={kernel}
                outputs={OUTPUTS}
              />
              <Output
                autoRun={false}
                kernel={kernel}
                code={"print('Hello Datalayer 👍')"}
              />
              <Output
                autoRun
                kernel={kernel}
                code={SOURCE}
              />
            </>
          )}
          {tab === 'IPyWidgets' && (
            <>
              <IPyWidgetsToolbar />
              <OutputIPyWidgets
                state={state}
                view={view}
              />
            </>
          )}
          {tab === 'Terminal' && (
            <>
              <TerminalToolbar />
              <Terminal height='500px' />
            </>
          )}
          {tab === 'Console' && (
            <>
              <ConsoleToolbar />
              <Console />
            </>
          )}
          {tab === 'Commands' && (
            <>
              <CommandsToolbar />
              <Commands />
            </>
          )}
          {tab === 'Dialog' && (
            <>
              <DialogToolbar />
              <Dialog />
            </>
          )}
          {tab === 'File Browser' && (
            <>
              <FileBrowserToolbar />
              <Box display="flex">
                <Box sx={{width: 400}}>
                  {serviceManager && <FileBrowser serviceManager={serviceManager}/> }
                </Box>
                <Box ml={3} sx={{width: 400}}>
                  <FileManagerJupyterLab />
                </Box>
              </Box>
            </>
          )}
          {tab === 'Lumino' && (
            <>
              <LuminoToolbar />
              <LuminoComponent />
            </>
          )}
          {tab === 'Settings' && (
            <>
              <SettingsToolbar />
              <Settings />
            </>
          )}
        </Box>
      </>
    }
    </Box>
  );
};

export default GalleryExample;
