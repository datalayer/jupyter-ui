/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Console } from '@datalayer/jupyter-react';

const meta: Meta<typeof Console> = {
  title: 'Components/Console',
  component: Console,
  argTypes: {
    lite: {
      control: 'radio',
      options: ['true', 'false', '@jupyterlite/javascript-kernel-extension'],
      table: {
        // Switching live does not work
        disable: true,
      },
    },
    initCode: {
      control: 'text',
    },
    code: {
      control: 'text',
      table: {
        // Switching live does not work
        disable: true,
      },
    },
  },
} as Meta<typeof Console>;

export default meta;

type Story = StoryObj<
  typeof Console | typeof Jupyter | { lite: string; code: string }
>;

const Template = (args, { globals: { labComparison } }) => {
  const { browser, initCode, ...others } = args;
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
      startDefaultKernel={true}
      lite={lite}
      initCode={initCode}
      defaultKernelName={kernelName}
      jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <Console {...others} />
    </Jupyter>
  );
};

export const Default: Story = Template.bind({}) as Story;

Default.args = {
  lite: 'false',
  initCode: '',
  code: "print('👋 Hello Jupyter Console')",
};

export const LitePython: Story = Template.bind({}) as Story;
LitePython.args = {
  ...Default.args,
  lite: 'true',
};

export const LiteJavascript: Story = Template.bind({}) as Story;
LiteJavascript.args = {
  ...Default.args,
  lite: '@jupyterlite/javascript-kernel-extension',
  code: "a = 'hello';\nArray(4).fill(`${a} the world`);",
};
