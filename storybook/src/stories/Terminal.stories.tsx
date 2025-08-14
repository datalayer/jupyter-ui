/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, JupyterProps, Terminal } from '@datalayer/jupyter-react';
import React from 'react';

const meta = {
  component: Terminal,
  title: 'Components/Terminal',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive terminal component for running shell commands.',
      },
    },
  },
  argTypes: {
    height: {
      control: 'text',
      description: 'Height of the terminal container',
    },
    colormode: {
      control: 'radio',
      options: ['dark', 'light'],
      description: 'Color theme for the terminal',
    },
    initCode: {
      control: 'text',
      description: 'Initial command to run when terminal starts',
    },
  },
} satisfies Meta<typeof Terminal>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithJupyter = (args, { globals }) => {
  return (
    <Jupyter
      startDefaultKernel={false}
      jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      terminals={true}
    >
      <Terminal {...args} />
    </Jupyter>
  );
};

export const Default: Story = {
  args: {
    height: '800px',
    colormode: 'light',
  },
  render: renderWithJupyter,
};

export const Playground: Story = {
  args: {
    ...Default.args,
    height: '800px',
    colormode: 'dark',
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Interactive terminal with dark theme.',
      },
    },
  },
};

export const WithInitialization: Story = {
  args: {
    ...Default.args,
    initCode: 'echo "Hello from shell $0"',
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Terminal that runs initialization code on startup.',
      },
    },
  },
};
