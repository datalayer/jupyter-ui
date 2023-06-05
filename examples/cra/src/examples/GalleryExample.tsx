import { useState, useMemo } from 'react';
import { UnderlineNav } from '@primer/react/drafts';
import { Box } from '@primer/react';
import {
  useJupyter,
  IpyWidgetsComponent,
  Cell,
  Commands,
  Console,
  Dialog,
  FileBrowser,
  FileBrowserLab,
  Notebook,
  Kernel,
  Output,
  Settings,
  Terminal,
} from '@datalayer/jupyter-react';
import { IOutput } from '@jupyterlab/nbformat';
import { AppsIcon, CpuIcon } from '@primer/octicons-react';
import LuminoToolbar from './lumino/LuminoToolbar';
import LuminoComponent from './lumino/LuminoComponent';
import IpyWidgetsToolbar from './ipywidgets/IpyWidgetsToolbar';
import IpyWidgetsExample from './ipywidgets/IPyWidgetsSimple';
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

const OUTPUT: IOutput[] = [
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

const NOTEBOOK_UID = 'notebook-id-gallery';

const GalleryExample = () => {
  const [tab, setTab] = useState('Notebook');
  const { kernelManager } = useJupyter();
  const kernel = useMemo(() => {
    if (kernelManager)
      return new Kernel({ kernelManager, kernelName: 'python' });
  }, [kernelManager]);
  return (
    <Box>
      <Box mb={3}>
        <UnderlineNav>
          <UnderlineNav.Item
            icon={CpuIcon}
            aria-current="page"
            onSelect={e => {
              e.preventDefault();
              setTab('Notebook');
            }}
          >
            Notebook
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={CpuIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('Cell');
            }}
          >
            Cell
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('Outputs');
            }}
          >
            Outputs
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={CpuIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('IpyWidgets');
            }}
          >
            IpyWidgets
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('Terminal');
            }}
          >
            Terminal
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('Console');
            }}
          >
            Console
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('Commands');
            }}
          >
            Commands
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('Dialog');
            }}
          >
            Dialog
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('File Browser');
            }}
          >
            File Browser
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('Lumino');
            }}
          >
            Lumino
          </UnderlineNav.Item>
          <UnderlineNav.Item
            icon={AppsIcon}
            onSelect={e => {
              e.preventDefault();
              setTab('Settings');
            }}
          >
            Settings
          </UnderlineNav.Item>
        </UnderlineNav>
      </Box>
      <Box>
        {tab === 'Lumino' && (
          <>
            <LuminoToolbar />
            <LuminoComponent />
          </>
        )}
        {tab === 'IpyWidgets' && (
          <>
            <IpyWidgetsToolbar />
            <IpyWidgetsComponent Widget={IpyWidgetsExample} />
          </>
        )}
        {tab === 'Outputs' && (
          <>
            <OutputToolbar />
            <Output outputs={OUTPUT} autoRun={false} kernel={kernel} />
            <Output
              autoRun={false}
              kernel={kernel}
              code={"print('Hello Datalayer 👍')"}
            />
            <Output autoRun={true} kernel={kernel} code={SOURCE} />
          </>
        )}
        {tab === 'Cell' && (
          <>
            <CellToolbar />
            <Cell source={SOURCE} />
          </>
        )}
        {tab === 'Notebook' && (
          <>
            <NotebookToolbarSimple notebookId={NOTEBOOK_UID} />
            <Notebook
              uid={NOTEBOOK_UID}
              path="ping.ipynb"
              ipywidgets="classic"
              CellSidebar={CellSidebar}
            />
          </>
        )}
        {tab === 'Commands' && (
          <>
            <CommandsToolbar />
            <Commands />
          </>
        )}
        {tab === 'Console' && (
          <>
            <ConsoleToolbar />
            <Console />
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
            <FileBrowser />
            <FileBrowserLab />
          </>
        )}
        {tab === 'Settings' && (
          <>
            <SettingsToolbar />
            <Settings />
          </>
        )}
        {tab === 'Terminal' && (
          <>
            <TerminalToolbar />
            <Terminal />
          </>
        )}
      </Box>
    </Box>
  );
};

export default GalleryExample;
