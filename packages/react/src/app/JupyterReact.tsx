import { useState} from 'react';
import { ThemeProvider, BaseStyles, Box } from '@primer/react';
import { CpuIcon } from '@primer/octicons-react';
import { UnderlineNav } from '@primer/react/drafts';
import CellTab from './tabs/CellTab';

const JupyterReact = (): JSX.Element => {
  const [tab, setTab] = useState(1);
  return (
    <>
      <ThemeProvider>
        <BaseStyles>
          <Box style={{maxWidth: 700}}>
            <Box mb={3}>
              <UnderlineNav>
                <UnderlineNav.Item aria-current="page" icon={CpuIcon} onSelect={e => {e.preventDefault(); setTab(1);}}>
                    Cell
                </UnderlineNav.Item>
              </UnderlineNav>
            </Box>
            <Box>
              {(tab === 1) && <CellTab/>}
            </Box>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    </>
  );
};

export default JupyterReact;
