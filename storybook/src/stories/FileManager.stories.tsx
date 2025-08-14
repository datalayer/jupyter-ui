/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, FileManagerJupyterLab, FileBrowser } from '@datalayer/jupyter-react';
import React from 'react';

const meta = {
  component: FileBrowser,
  title: 'Components/FileManager',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'File browser component for managing Jupyter files.',
      },
    },
  },
  argTypes: {
    // Add any specific argTypes for FileBrowser here if needed
  },
} satisfies Meta<typeof FileBrowser>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithJupyter = (args, { globals }) => {
  const { labComparison } = globals || {};
  return (
    <Jupyter
      jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <FileBrowser {...args} />
      {labComparison === 'display' && <FileManagerJupyterLab />}
    </Jupyter>
  );
};

export const Default: Story = {
  args: {},
  render: renderWithJupyter,
};

export const Playground: Story = {
  args: {},
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Interactive file browser with JupyterLab comparison.',
      },
    },
  },
};
