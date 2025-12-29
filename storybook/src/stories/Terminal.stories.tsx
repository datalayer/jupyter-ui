/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { JupyterReactTheme, Terminal } from '@datalayer/jupyter-react';

const meta: Meta<typeof Terminal> = {
  title: 'Components/Terminal',
  component: Terminal,
  argTypes: {
    // height: {
    //   type: 'string',
    // },
    colormode: {
      options: ['dark', 'light'],
    },
  },
} as Meta<typeof Terminal>;

export default meta;

type Story = StoryObj<typeof Terminal | typeof JupyterReactTheme>;

const Template = (args, { globals: { labComparison } }) => {
  return (
    <JupyterReactTheme
    //      startDefaultKernel={false}
    //      jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
    //      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    //      terminals={true}
    >
      <Terminal {...args} />
    </JupyterReactTheme>
  );
};

export const Default: Story = Template.bind({}) as Story;
Default.args = {
  height: '800px',
  colormode: 'light',
};

export const Playground: Story = Template.bind({}) as Story;
Playground.args = {
  ...Default.args,
  height: '800px',
  colormode: 'dark',
};

export const WithInitialization: Story = Template.bind({}) as Story;
WithInitialization.args = {
  ...Default.args,
  initCode: 'echo "Hello from shell $0"',
};
