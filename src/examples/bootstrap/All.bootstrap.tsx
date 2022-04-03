import { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import Jupyter from '../../jupyter/Jupyter';
import { useJupyter } from '../../jupyter/JupyterContext';
import CellLumino from '../../widgets/cell/CellLumino';
import CellControl from './../controls/CellControl';
import CommandsLumino from '../../widgets/commands/CommandsLumino';
import CommandsControl from '../controls/CommandsControl';
import ConsoleLumino from '../../widgets/console/ConsoleLumino';
import ConsoleControl from '../controls/ConsoleControl';
// import DialogLumino from './../components/dialog/DialogLumino';
import DialogControl from '../controls/DialogControl';
import FileBrowser from '../../widgets/filebrowser/FileBrowser';
import FileBrowserLumino from '../../widgets/filebrowser/FileBrowserLumino';
import FileBrowserControl from '../controls/FileBrowserControl';
import NotebookLumino from '../../widgets/notebook/NotebookLumino';
import NotebookControl from '../controls/NotebookControl';
import OutputLumino from '../../widgets/outputs/OutputLumino';
import OutputControl from '../controls/OutputsControl';
import Kernel from '../../services/kernel/Kernel';
import SettingsLumino from '../../widgets/settings/SettingsLumino';
import SettingsControl from '../controls/SettingsControl';
import SimpleLumino from '../components/lumino/LuminoExample';
import SimpleControl from '../controls/SimpleControl';
import TerminalLumino from '../../widgets/terminal/TerminalLumino';
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
    <OutputLumino showEditor={true} autoRun={false} kernel={kernel} code={"print('Hello Datalayer 👍')"} />
    <OutputLumino showEditor={true} autoRun={true} kernel={kernel} code={source} />
    <OutputLumino showEditor={false} autoRun={true} kernel={kernel} code={"print('=> Hello Datalayer again... I am the output of an non-shown editor 👍 <=')"} />
    <CellControl />
    <CellLumino source={source} />
    <CommandsControl />
    <CommandsLumino />
    <ConsoleControl />
    <ConsoleLumino />
    <DialogControl />
{/*
    <DialogLumino />
*/}
    <FileBrowserControl />
    <FileBrowser />
    <FileBrowserLumino />
    <NotebookControl />
    <NotebookLumino path='ping.ipynb' ipywidgets='classic'/>
    <SettingsControl />
    <SettingsLumino />
    <SimpleControl />
    <SimpleLumino />
    <TerminalControl />
    <TerminalLumino />
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
