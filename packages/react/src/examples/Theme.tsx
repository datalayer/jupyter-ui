/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Button, Heading, Text, Link, PageLayout, PageHeader } from '@primer/react';
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
      <Text as="h3"><Link href="https://datalayer.io" target="_blank">This is a heading 3 link</Link></Text>
    </Box>
    <Box>
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="invisible">Invisible</Button>
      <Button variant="danger">Danger</Button>
    </Box>
    <PageLayout containerWidth="full" padding="normal">
      <PageLayout.Header>
        <PageHeader>
          <PageHeader.TitleArea variant="large">
            <PageHeader.Title>
              Documentation
            </PageHeader.Title>
          </PageHeader.TitleArea>
          <PageHeader.Description>
            <Text sx={{
              fontSize: 1,
              color: 'fg.muted'
            }}>
              Usefull links...
            </Text>
          </PageHeader.Description>
        </PageHeader>
      </PageLayout.Header>
      <PageLayout.Content>
        <Box>
          <Text as="h3"><Link href="https://datalayer.io" target="_blank">User Guide</Link></Text>
        </Box>
        <Box>
          <Text as="h3"><Link href="https://datalayer.io" target="_blank">Pricing</Link></Text>
        </Box>
        <Box>
          <Text as="h3"><Link href="https://datalayer.io" target="_blank">Privacy</Link></Text>
        </Box>
        <Box>
          <Text as="h3"><Link href="https://datalayer.io" target="_blank">Terms and conditions</Link></Text>
        </Box>
      </PageLayout.Content>
    </PageLayout>
  </JupyterReactTheme>
);

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<Theme />);
