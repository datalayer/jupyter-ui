/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { PageHeader, Label, Text, Link, Box } from '@primer/react';
import { ECharlesIcon } from '@datalayer/icons-react/eggs';

type Props = {
  version: string;
};

export const AboutTab = (props: Props): JSX.Element => {
  const { version } = props;
  const [egg, setEgg] = useState(false);
  return (
    <>
      <PageHeader as="h2">
        🪐 ⚛️ Jupyter React<Label sx={{ marginLeft: 1 }}>{version}</Label>
      </PageHeader>
      <Box>
        <Text>React.js components 💯% compatible with 🪐 Jupyter.</Text>
      </Box>
      <Box>
        <Link
          href="https://datalayer.tech/docs/releases/1.2.0-black-snake"
          target="_blank"
        >
          <Text as="h4">Datalayer 1.2.0 Black Snake Release</Text>
        </Link>
      </Box>
      <Box>
        <Link
          href="https://github.com/datalayer/jupyter-ui/tree/main/packages/react"
          target="_blank"
        >
          <Text as="h4">Source code</Text>
        </Link>
      </Box>
      <Box mt={3}>
        {!egg ? (
          <img
            src="https://assets.datalayer.tech/releases/datalayer-1.2.0-black-snake_1024.png"
            onClick={e => setEgg(true)}
          />
        ) : (
          <ECharlesIcon size={300} onClick={e => setEgg(false)} />
        )}
      </Box>
    </>
  );
};

export default AboutTab;
