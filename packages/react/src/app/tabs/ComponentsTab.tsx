import { useState } from 'react';
import { Box, NavList } from '@primer/react';
import { JupyterFrontEndProps } from '../JupyterReact';
import FileBrowserComponent from './components/FileBrowserComponent';
import CellComponent from './components/CellComponent';
import NotebookComponent from './components/NotebookComponent';
import IPyWidgetsComponent from './components/IPyWidgetsComponent';

const MainTab = (props: JupyterFrontEndProps) => {
  const [nav, setNav] = useState(1);
  return (
    <>
      <Box sx={{display: 'flex'}}>
        <Box>
          <NavList sx={{
            '> *': {
              paddingTop: '0px'
            }
          }}>
            <NavList.Item aria-current={nav === 1 ? 'page' : undefined} onClick={e => setNav(1)}>
              File Browser
            </NavList.Item>
            <NavList.Item aria-current={nav === 2 ? 'page' : undefined} onClick={e => setNav(2)}>
              Cell
            </NavList.Item>
            <NavList.Item aria-current={nav === 3 ? 'page' : undefined} onClick={e => setNav(3)}>
              Notebook
            </NavList.Item>
            <NavList.Item aria-current={nav === 4 ? 'page' : undefined} onClick={e => setNav(4)}>
              IPyWidgets
            </NavList.Item>
          </NavList>
        </Box>
        <Box ml={3} sx={{ width: '100%'}}>
          {(nav === 1) && <FileBrowserComponent/>}
          {(nav === 2) && <CellComponent/>}
          {(nav === 3) && <NotebookComponent/>}
          {(nav === 4) && <IPyWidgetsComponent/>}
        </Box>
      </Box>
    </>
  );
}

export default MainTab;
