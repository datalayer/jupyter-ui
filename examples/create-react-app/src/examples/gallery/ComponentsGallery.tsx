import React, { useState, useMemo } from 'react';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {
  useJupyter, IpyWidgetsComponent, Cell, Commands, Console, Dialog,
  FileBrowser, Notebook, Kernel, Output, Settings, Terminal
} from '@datalayer/jupyter-react';
import { IOutput } from "@jupyterlab/nbformat";
import FileBrowserTree from "./../../components/FileBrowserTree";
import LuminoToolbar from '../lumino/LuminoToolbar';
import LuminoComponent from '../lumino/LuminoComponent';
import IpyWidgetsToolbar from '../ipywidgets/IpyWidgetsToolbar';
import IpyWidgetsExample from '../ipywidgets/IPyWidgetsSimple';
import CellToolbar from '../cell/CellToolbar';
import CommandsToolbar from '../commands/CommandsToolbar';
import NotebookToolbar from '../notebook/NotebookSimpleToolbar';
import CellSidebarExample from '../notebook/CellSidebarComponent';
import OutputToolbar from '../outputs/OutputsToolbar';
import FileBrowserToolbar from '../filebrowser/FileBrowserToolbar';
import ConsoleToolbar from '../console/ConsoleToolbar';
import SettingsToolbar from '../settings/SettingsToolbar';
import DialogToolbar from '../dialog/DialogToolbar';
import TerminalToolbar from '../terminal/TerminalToolbar';

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
     "data": {
      "application/json": {
       "array": [
        1,
        2,
        3
       ],
       "bool": true,
       "object": {
        "foo": "bar"
       },
       "string": "string"
      },
      "text/plain": [
       "<IPython.core.display.JSON object>"
      ]
     },
     "execution_count": 8,
     "metadata": {
      "application/json": {
       "expanded": false,
       "root": "root"
      }
     },
     "output_type": "execute_result"
    }
  ];

const NOTEBOOK_UID = "notebook-id-gallery";

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function tabsProps(index: any) {
  return {
    id: `vertical-tab-${index}`,
    'aria-Toolbars': `vertical-tabpanel-${index}`,
  }
}

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    height: 1200,
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const Gallery = () => {
  const { kernelManager } = useJupyter();
  const classes = useStyles();
  const [value, setValue] = useState(0);
  const kernel = useMemo(() => {
    if (kernelManager) return new Kernel({ kernelManager, kernelName: 'python3' });
  }, [kernelManager]);
  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };
  return (
    <div className={classes.root}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        className={classes.tabs}
      >
        <Tab label="Lumino" {...tabsProps(0)}/>
        <Tab label="IpyWidgets" {...tabsProps(1)}/>
        <Tab label="Outputs" {...tabsProps(2)}/>
        <Tab label="Cell" {...tabsProps(3)}/>
        <Tab label="Notebook" {...tabsProps(4)}/>
        <Tab label="Commands" {...tabsProps(5)}/>
        <Tab label="Console" {...tabsProps(6)}/>
        <Tab label="Dialog" {...tabsProps(7)}/>
        <Tab label="File Browser" {...tabsProps(8)}/>
        <Tab label="Settings" {...tabsProps(9)}/>
        <Tab label="Terminal" {...tabsProps(10)}/>
      </Tabs>
      <div style={{ width: '100vh' }}>
        <TabPanel value={value} index={0}>
          <LuminoToolbar/>
          <LuminoComponent/>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <IpyWidgetsToolbar/>
          <IpyWidgetsComponent Widget={IpyWidgetsExample}/>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <OutputToolbar/>
          <Output
            outputs={OUTPUT}
            autoRun={false}
            kernel={kernel}
         />
          <Output
            autoRun={false}
            kernel={kernel}
            code={"print('Hello Datalayer 👍')"}
         />
          <Output
            autoRun={true}
            kernel={kernel}
            code={SOURCE}
         />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <CellToolbar/>
          <Cell source={SOURCE}/>
        </TabPanel>
        <TabPanel value={value} index={4}>
          <NotebookToolbar notebookId={NOTEBOOK_UID}/>
          <Notebook
            uid={NOTEBOOK_UID}
            path='ping.ipynb'
            ipywidgets="classic"
            CellSidebar={CellSidebarExample}
            />
        </TabPanel>
        <TabPanel value={value} index={5}>
          <CommandsToolbar/>
          <Commands/>
        </TabPanel>
        <TabPanel value={value} index={6}>
          <ConsoleToolbar/>
          <Console/>
        </TabPanel>
        <TabPanel value={value} index={7}>
          <DialogToolbar/>
          <Dialog/>
        </TabPanel>
        <TabPanel value={value} index={8}>
          <FileBrowserToolbar/>
          <FileBrowserTree/>
          <FileBrowser/>
        </TabPanel>
        <TabPanel value={value} index={9}>
          <SettingsToolbar/>
          <Settings/>
        </TabPanel>
        <TabPanel value={value} index={10}>
          <TerminalToolbar/>
          <Terminal/>
        </TabPanel>
      </div>
    </div>
  );
}

export default Gallery;
