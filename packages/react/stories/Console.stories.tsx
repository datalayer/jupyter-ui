/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Console } from './../src';
import React from 'react';

const meta: Meta<typeof Console> = {
  title: 'Components/Console',
  argTypes: {
    lite: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<typeof Console>;

export default meta;

type Story = StoryObj<typeof Console>;

const Template = (args, { globals: { labComparison } }) => {
  const browserKernelModel = {
    true: true,
    false: false,
    '@jupyterlite/javascript-kernel-extension': import(
      '@jupyterlite/javascript-kernel-extension'
    ),
  }[args.lite];

  const kernelName =
    args.lite === '@jupyterlite/javascript-kernel-extension'
      ? 'javascript'
      : undefined;

  return (
    <Jupyter
      lite={browserKernelModel}
      defaultKernelName={kernelName}
      jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
      jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
      jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <Console {...args} />
    </Jupyter>
  );
};

export const Default: Story = Template.bind({});
Default.args = {
  lite: 'false',
};

export const InBrowser: Story = Template.bind({});
InBrowser.args = {
  ...Default.args,
  lite: 'true',
};

export const InBrowserJS: Story = Template.bind({});
InBrowserJS.args = {
  ...Default.args,
  lite: '@jupyterlite/javascript-kernel-extension',
};
