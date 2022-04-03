import { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import Jupyter from '../../jupyter/Jupyter';
import { useJupyter } from '../../jupyter/JupyterContext';
import Cell from '../../components/cell/Cell';
import CellControl from './../controls/CellControl';
import Commands from '../../components/commands/Commands';
import CommandsControl from '../controls/CommandsControl';
import Console from '../../components/console/Console';
import ConsoleControl from '../controls/ConsoleControl';
// import Dialog from './../components//dialog/Dialog';
import DialogControl from '../controls/DialogControl';
import FileBrowserTree from '../../components/filebrowser/FileBrowserTree';
import FileBrowser from '../../components/filebrowser/FileBrowser';
import FileBrowserControl from '../controls/FileBrowserControl';
import Notebook from '../../components/notebook/Notebook';
import NotebookControl from '../controls/NotebookControl';
import Output from '../../components/outputs/Output';
import OutputControl from '../controls/OutputsControl';
import Kernel from '../../services/kernel/Kernel';
import Settings from '../../components/settings/Settings';
import SettingsControl from '../controls/SettingsControl';
import SimpleLumino from '../components//lumino/LuminoExample';
import SimpleControl from '../controls/SimpleControl';
import Terminal from '../../components/terminal/Terminal';
import TerminalControl from '../controls/TerminalControl';

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

/**
 * A simple example for the Jupyter React.
 */
const Example = () => {
  const { baseUrl, wsUrl } = useJupyter();
  const [kernel,] = useState(new Kernel({ baseUrl, wsUrl }));
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return <>
    <OutputControl />
    <Output showEditor={true} autoRun={false} kernel={kernel} code={"print('Hello Datalayer 👍')"} />
    <Output showEditor={true} autoRun={true} kernel={kernel} code={source} />
    <Output showEditor={false} autoRun={true} kernel={kernel} code={"print('=> Hello Datalayer again... I am the output of an non-shown editor 👍 <=')"} />
    <CellControl />
    <Cell source={source} />
    <CommandsControl />
    <Commands />
    <ConsoleControl />
    <Console />
    <DialogControl />
{/*
    <Dialog />
*/}
    <FileBrowserControl />
    <FileBrowserTree />
    <FileBrowser />
    <NotebookControl />
    <Notebook
      path='ping.ipynb'
      ipywidgets='classic'
      />
    <SettingsControl />
    <Settings />
    <SimpleControl />
    <SimpleLumino />
    <TerminalControl />
    <Terminal />
  </>
}

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={true} terminals={true}>
      <Example/>
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
