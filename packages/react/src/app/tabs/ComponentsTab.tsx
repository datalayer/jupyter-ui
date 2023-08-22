import { useState } from 'react';
import { Box, NavList } from '@primer/react';
import { JupyterFrontEndProps } from '../JupyterReact';
import FileBrowserComponent from './components/FileBrowserComponent';

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
          </NavList>
        </Box>
        <Box ml={3} sx={{ width: '100%'}}>
          {(nav === 1) && <FileBrowserComponent/>}
        </Box>
      </Box>
    </>
  );
}

export default MainTab;
