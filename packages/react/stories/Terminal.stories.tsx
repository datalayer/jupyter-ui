/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Terminal } from './../src';
import React from 'react';

const meta: Meta<typeof Terminal> = {
  title: 'Components/Terminal',
} as Meta<typeof Terminal>;

export default meta;

type Story = StoryObj<typeof Terminal>;

const Template = (args, { globals: { labComparison } }) => {
  const Tag = `${(args.as as string) ?? 'span'}` as keyof JSX.IntrinsicElements;
  return (
    <Jupyter
      jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
      jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
      jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      startDefaultKernel={false}
      terminals={true}
    >
      <Terminal {...args} />
    </Jupyter>
  );
};

export const Default: Story = Template.bind({});

export const Playground: Story = {
  render: Template.bind({}),
};

Playground.args = {
  height: '800px',
  theme: 'dark',
};

Playground.argTypes = {
  height: {
    type: 'string',
  },
  theme: {
    type: 'string',
  },
};
