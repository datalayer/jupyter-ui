import { useState, useEffect } from 'react';
import { ThemeProvider, BaseStyles, Box } from '@primer/react';
import { observer } from 'mobx-react';
import { ThemeProvider as BrandThemeProvider } from '@primer/react-brand'
import { UnderlineNav } from '@primer/react';
import { DashboardGreenIcon } from '@datalayer/icons-react';
import { requestAPI } from './handler';
import DashboardTab from './tabs/DashboardTab';
import AboutTab from './tabs/AboutTab';
import appState from "./state";

import '@primer/react-brand/lib/css/main.css';

const DashboardHome = observer((): JSX.Element => {
  const [version, setVersion] = useState('');
  useEffect(() => {
    requestAPI<any>('config')
    .then(data => {
      setVersion(data.version);
    })
    .catch(reason => {
      console.error(
        `Error while accessing the jupyter server jupyter_dashboard extension.\n${reason}`
      );
    });
  });
  return (
    <>
      <BrandThemeProvider>
        <ThemeProvider>
          <BaseStyles>
            <Box className="datalayer-Primer-Brand">
              <Box>
                <UnderlineNav aria-current="page" aria-label="clouder">
                  <UnderlineNav.Item aria-label="clouder" aria-current={appState.tab === 1 ? "page" : undefined} icon={DashboardGreenIcon} onSelect={e => {e.preventDefault(); appState.setTab(1);}}>
                    Dashboard
                  </UnderlineNav.Item>
                  <UnderlineNav.Item aria-label="about" aria-current={appState.tab === 2 ? "page" : undefined} icon={DashboardGreenIcon} onSelect={e => {e.preventDefault(); appState.setTab(2);}}>
                    About
                  </UnderlineNav.Item>
                </UnderlineNav>
              </Box>
              <Box m={3}>
                {(appState.tab === 1) && <DashboardTab/>}
                {(appState.tab === 2) && <AboutTab version={version}/>}
              </Box>
            </Box>
          </BaseStyles>
        </ThemeProvider>
      </BrandThemeProvider>
    </>
  );
});

export default DashboardHome;
