/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Button, Heading, Text, Link } from '@primer/react';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';

const Theme = () => (
  <JupyterReactTheme>
    <Heading>Jupyter Theme</Heading>
    <Box>
      <Text as="h1">Heading 1</Text>
      <Text as="h2">Heading 2</Text>
      <Text as="h3">Heading 3</Text>
      <Text>This is a text.</Text>
      <br/>
      <Link href="https://datalayer.io" target="_blank">This is a link.</Link>
      <br/>
      <Text as="h3"><Link href="https://datalayer.io" target="_blank">This is a Heading3 link</Link></Text>
    </Box>
    <Box>
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="invisible">Invisible</Button>
      <Button variant="danger">Danger</Button>
    </Box>
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Theme />);
