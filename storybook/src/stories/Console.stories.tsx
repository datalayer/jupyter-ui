/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Jupyter, Console } from '@datalayer/jupyter-react';

const meta = {
  component: Console,
  title: 'Components/Console',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Interactive Jupyter Console for running code.',
      },
    },
  },
  argTypes: {
    lite: {
      control: 'radio',
      options: ['true', 'false', '@jupyterlite/javascript-kernel-extension'],
      description: 'Kernel type to use (remote server, lite Python, or lite JavaScript)',
      table: {
        // Switching live does not work
        disable: true,
      },
    },
    initCode: {
      control: 'text',
      description: 'Initialization code to run before console starts',
    },
    code: {
      control: 'text',
      description: 'Initial code to display in the console',
      table: {
        // Switching live does not work
        disable: true,
      },
    },
  },
} satisfies Meta<typeof Console>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderWithJupyter = (args, { globals }) => {
  const { lite: liteOption, initCode, ...consoleProps } = args;
  
  const lite = {
    true: true,
    false: false,
    '@jupyterlite/javascript-kernel-extension': import(
      '@jupyterlite/javascript-kernel-extension'
    ),
  }[liteOption];

  const kernelName =
    liteOption === '@jupyterlite/javascript-kernel-extension'
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
      <Console {...consoleProps} />
    </Jupyter>
  );
};

export const Default: Story = {
  args: {
    lite: 'false',
    initCode: '',
    code: "print('👋 Hello Jupyter Console')",
  },
  render: renderWithJupyter,
};

export const LitePython: Story = {
  args: {
    ...Default.args,
    lite: 'true',
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Console running with JupyterLite Python kernel in the browser.',
      },
    },
  },
};

export const LiteJavascript: Story = {
  args: {
    ...Default.args,
    lite: '@jupyterlite/javascript-kernel-extension',
    code: "a = 'hello';\nArray(4).fill(`${a} the world`);",
  },
  render: renderWithJupyter,
  parameters: {
    docs: {
      description: {
        story: 'Console running with JupyterLite JavaScript kernel in the browser.',
      },
    },
  },
};
