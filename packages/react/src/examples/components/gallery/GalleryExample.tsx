import React, { useState, useMemo } from 'react';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import LuminoControl from '../../controls/LuminoControl';
import LuminoExample from './../lumino/LuminoExample';
import IpyWidgetsControl from '../../controls/IpyWidgetsControl';
import IpyWidgetsExample from '../ipywidgets/IpyWidgetsExample';
import IpyWidgetsComponent from './../../../components/ipywidgets/IpyWidgetsComponent';
import { Cell } from '../../../index';
import CellControl from '../../controls/CellControl';
import { Commands } from '../../../index';
import CommandsControl from '../../controls/CommandsControl';
import { Console } from '../../../index';
import ConsoleControl from '../../controls/ConsoleControl';
import { Dialog } from '../../../index';
import DialogControl from '../../controls/DialogControl';
import FileBrowserTree from '../../../components/filebrowser/FileBrowserTree';
import FileBrowser from '../../../components/filebrowser/FileBrowser';
import FileBrowserControl from '../../controls/FileBrowserControl';
import { Notebook } from '../../../index';
import NotebookControl from '../../controls/NotebookControl';
import CellSidebarExample from './../notebook/CellSidebarExample';
import { Kernel } from '../../../index';
import { Output } from '../../../index';
import OutputsControl from '../../controls/OutputsControl';
import { Settings } from '../../../index';
import SettingsControl from '../../controls/SettingsControl';
import { Terminal } from '../../../index';
import TerminalControl from '../../controls/TerminalControl';

/**
 * The source code to be shown in the examples.
 */
const SOURCE_1 = `from IPython.display import display
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

const OUTPUT_2 = (
  [
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
  ]
);

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
    'aria-controls': `vertical-tabpanel-${index}`,
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
  const classes = useStyles();
  const [value, setValue] = useState(0);
  const kernel = useMemo(() => new Kernel(), [])
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
          <LuminoControl/>
          <LuminoExample/>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <IpyWidgetsControl/>
          <IpyWidgetsComponent widget={IpyWidgetsExample}/>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <OutputsControl/>
          <Output
            initialOutput={OUTPUT_2 as any}
            showEditor={false}
            autoRun={false}
            kernel={kernel}
         />
          <Output
            showEditor={true}
            autoRun={false}
            kernel={kernel}
            code={"print('Hello Datalayer 👍')"}
         />
          <Output
            showEditor={true}
            autoRun={true}
            kernel={kernel}
            code={SOURCE_1}
         />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <CellControl/>
          <Cell source={SOURCE_1}/>
        </TabPanel>
        <TabPanel value={value} index={4}>
          <NotebookControl/>
          <Notebook
            path='ping.ipynb'
            ipywidgets="classic"
            sidebarComponent={CellSidebarExample}
            />
        </TabPanel>
        <TabPanel value={value} index={5}>
          <CommandsControl/>
          <Commands/>
        </TabPanel>
        <TabPanel value={value} index={6}>
          <ConsoleControl/>
          <Console/>
        </TabPanel>
        <TabPanel value={value} index={7}>
          <DialogControl/>
          <Dialog/>
        </TabPanel>
        <TabPanel value={value} index={8}>
          <FileBrowserControl/>
          <FileBrowserTree/>
          <FileBrowser/>
        </TabPanel>
        <TabPanel value={value} index={9}>
          <SettingsControl/>
          <Settings/>
        </TabPanel>
        <TabPanel value={value} index={10}>
          <TerminalControl/>
          <Terminal/>
        </TabPanel>
      </div>
    </div>
  );
}

export default Gallery;
