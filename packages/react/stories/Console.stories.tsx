/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Console } from './../src';

const meta: Meta<typeof Console> = {
  title: 'Components/Console',
  argTypes: {
    browser: {
      table: {
        disable: true,
      },
    },
  },
} as Meta<typeof Console>;

export default meta;

type Story = StoryObj<typeof Console | typeof Jupyter | {browser: string}>;

const Template = (args, { globals: { labComparison } }) => {
  const lite = {
    true: true,
    false: false,
    '@jupyterlite/javascript-kernel-extension': import(
      '@jupyterlite/javascript-kernel-extension'
    ),
  }[args.browser];

  const kernelName =
    args.browser === '@jupyterlite/javascript-kernel-extension'
      ? 'javascript'
      : undefined;

  return (
    <Jupyter
      lite={lite}
      defaultKernelName={kernelName}
      jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
      jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
      jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <Console
        code={
          kernelName === 'javascript' ? [
            "a = 'hello';",
            "Array(4).fill(`${a} the world`);"
          ] : [
            "print('👋 Hello Jupyter Console')"
          ]
        }
      />
    </Jupyter>
  );
};

export const Default: Story = Template.bind({});
Default.args = {
  browser: 'false',
};

export const LitePython: Story = Template.bind({});
LitePython.args = {
  ...Default.args,
  browser: 'true',
};

export const LiteJavascript: Story = Template.bind({});
LiteJavascript.args = {
  ...Default.args,
  browser: '@jupyterlite/javascript-kernel-extension',
};
