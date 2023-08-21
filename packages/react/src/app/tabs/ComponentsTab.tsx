import { useState } from 'react';
import { RingedPlanetIcon } from '@datalayer/icons-react';
import { Box, NavList } from '@primer/react';
import { JupyterFrontEndProps } from '../JupyterReact';
import Content from './content/Content';

const MainTab = (props: JupyterFrontEndProps) => {
  const { app } = props;
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
              <NavList.LeadingVisual>
                <RingedPlanetIcon />
              </NavList.LeadingVisual>
              File Browser
            </NavList.Item>
          </NavList>
        </Box>
        <Box ml={3} sx={{ width: '100%'}}>
          {(nav === 1) && <Content app={app} />}
        </Box>
      </Box>
    </>
  );
}

export default MainTab;
