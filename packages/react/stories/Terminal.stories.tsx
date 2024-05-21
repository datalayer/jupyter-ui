/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, JupyterProps, Terminal } from '@datalayer/jupyter-react';
import React from 'react';

const meta: Meta<typeof Terminal> = {
  title: 'Components/Terminal',
  component: Terminal,
  argTypes: {
    // height: {
    //   type: 'string',
    // },
    colorMode: {
      options: ['dark', 'light'],
    },
  },
} as Meta<typeof Terminal>;

export default meta;

type Story = StoryObj<typeof Terminal | typeof Jupyter>;

const Template = (args, { globals: { labComparison } }) => {
  return (
    <Jupyter
      jupyterServerHttpUrl="https://oss.datalayer.run/api/jupyter-server"
      jupyterServerWsUrl="wss://oss.datalayer.run/api/jupyter-server"
      jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      startDefaultKernel={false}
      terminals={true}
    >
      <Terminal {...args} />
    </Jupyter>
  );
};

export const Default: Story = Template.bind({});
Default.args = {
  height: '800px',
  colorMode: 'light',
};

export const Playground: Story = Template.bind({});
Playground.args = {
  ...Default.args,
  height: '800px',
  colorMode: 'dark',
};

export const WithInitialization: Story = Template.bind({});
WithInitialization.args = {
  ...Default.args,
  initCode: 'echo "Hello from shell $0"\n',
};
