/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Notebook } from './../src';
import React from 'react';

const meta: Meta<typeof Notebook> = {
  title: 'Components/Notebook',
} as Meta<typeof Notebook>;

export default meta;

type Story = StoryObj<typeof Notebook>;

const Template = (args, { globals: { labComparison } }) => {
  const Tag = `${(args.as as string) ?? 'span'}` as keyof JSX.IntrinsicElements;
  return (
    <Jupyter
      jupyterServerHttpUrl='https://oss.datalayer.tech/api/jupyter'
      jupyterServerWsUrl='wss://oss.datalayer.tech/api/jupyter'
      jupyterToken='60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6'
    >
      <Notebook
        {...args}
      />
    </Jupyter>
  );
};

export const Default: Story = Template.bind({});

export const Playground: Story = {
  render: Template.bind({}),
};

Playground.args = {
  path: 'ipywidgets.ipynb',
  ipywidgets: 'classic',
  uid: 'uid-1',
};

Playground.argTypes = {
  path: {
    type: 'string',
  },
  ipywidgets: {
    type: 'string',
  },
  uid: {
    type: 'string',
  },
};
