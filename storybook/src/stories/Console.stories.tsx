/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { JupyterReactTheme, Console } from '@datalayer/jupyter-react';

const meta: Meta<typeof Console> = {
  title: 'Components/Console',
  component: Console,
  argTypes: {
    lite: {
      control: 'radio',
      options: ['true', 'false', 'pyodide', 'javascript'],
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
  typeof Console | typeof JupyterReactTheme | { lite: string; code: string }
>;

const Template = (args, { globals: { labComparison } }) => {
  const { browser, initCode, ...others } = args;
  const lite = {
    true: true,
    false: false,
    pyodide: import('@datalayer/jupyter-react/lite').then(
      m => m.pyodideKernelExtension,
    ),
    javascript: import('@datalayer/jupyter-react/lite').then(
      m => m.javascriptKernelExtension,
    ),
  }[args.browser];

  const kernelName =
    args.browser === 'javascript'
      ? 'javascript'
      : args.browser === 'pyodide'
        ? 'python'
        : undefined;

  return (
    <JupyterReactTheme
    //      startDefaultKernel={true}
    //      lite={lite}
    //      initCode={initCode}
    //      defaultKernelName={kernelName}
    //      jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
    //      jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
    >
      <Console {...others} />
    </JupyterReactTheme>
  );
};

export const Default: Story = Template.bind({}) as Story;

Default.args = {
  lite: 'false',
  //  initCode: '',
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
  lite: 'javascript',
  code: "a = 'hello';\nArray(4).fill(`${a} the world`);",
};
